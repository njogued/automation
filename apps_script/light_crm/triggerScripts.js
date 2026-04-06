function createOrUpdateDailyTriggers(obj) {
  if (!obj.reminderTime) return;
  deleteTriggersByHandler_('sendDailyReminderEmail');
  if (obj.enableEmailReminders !== false) {
    const [hh, mm]  = obj.reminderTime.split(':').map(Number);
    // const preHour   = (hh + 23) % 24;            // 1 hour earlier
    // const preMinute = mm;
    // ScriptApp.newTrigger('logImportantActivity')
    //   .timeBased()
    //   .atHour(preHour).nearMinute(preMinute)
    //   .everyDays(1)
    //   .create();
    ScriptApp.newTrigger('sendDailyReminderEmail')
      .timeBased()
      .atHour(hh).nearMinute(mm)
      .everyDays(1)
      .create();
  } else {
    Logger.log("User decided NOT to receive reminders.");
  }
}


function sendDailyReminderEmail() {
  logImportantActivity();
  let actionsText = "\n";
  let topActions = "";
  const { enableAI = true } = getUserSettings();
  if (enableAI) {
    const actions = analyzeContactsWithAI();
    if (Object.keys(actions) && Object.keys(actions).length > 0) {
      actionsText = "\n\nHere are the top AI Recommended next steps:\n"
      topActions = actions.map(a => `• ${a}`).join('\n');
    }
  }
  const activitiesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACTIVITIES);
  const activitiesData = activitiesSheet.getDataRange().getValues();
  const url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const today = new Date();
  const followUps = [];

  // Headers
  const headers = activitiesData[0];
  const emailIndex = headers.indexOf(ACTIVITIES_HEADERS.EMAIL);
  const typeIndex = headers.indexOf(ACTIVITIES_HEADERS.TYPE);
  const ownerIndex = headers.indexOf(ACTIVITIES_HEADERS.OWNER);
  const summaryIndex = headers.indexOf(ACTIVITIES_HEADERS.SUMMARY);
  const nextTouchIndex = headers.indexOf(ACTIVITIES_HEADERS.DATE);
  const { reminderEmail = '' } = getUserSettings();
  const senderName = getDefaultSenderName();
  let bodyPlain = ""

  if (reminderEmail === '') return;

  for (let i = 1; i < activitiesData.length; i++) {
    const row = activitiesData[i];
    const nextTouch = new Date(row[nextTouchIndex]);

    // Normalize dates to avoid time discrepancies
    if (
      nextTouch.getFullYear() === today.getFullYear() &&
      nextTouch.getMonth() === today.getMonth() &&
      nextTouch.getDate() === today.getDate()
    ) {
      followUps.push({
        type: row[typeIndex],
        email: row[emailIndex],
        owner: row[ownerIndex],
        summary: row[summaryIndex],
      });
    }
  }

  if (followUps.length > 0) {
    const emailBody = followUps
      .map((contact, i) => 
        `${i + 1}. ${contact.type} (${contact.email})\n\tOwner: ${contact.owner || "N/A"}\n\tSummary: ${contact.summary || "None"}`
      ).join('\n\n');
    bodyPlain = `Hi - \n\nHere are your follow-ups for today (${today.toDateString()}):\n\n${emailBody}${actionsText}${topActions}\n\n---\nHere's the link to Light CRM: ${url}`;
    GmailApp.sendEmail(reminderEmail, "Daily Follow-up Reminder", bodyPlain, {name: senderName});
  } else {
    bodyPlain = `Hi - \n\nThere are no follow-ups for today (${today.toDateString()})${actionsText}${topActions}\n\n---\nHere's the link to Light CRM: ${url}`;
    GmailApp.sendEmail(reminderEmail, "Daily Follow-up Reminder", bodyPlain, {name: senderName});
  }
  return;
}

function logImportantActivity() {
  const remindersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_REMINDERS);
  const data = remindersSheet.getDataRange().getValues();
  const today = new Date();
  const remindHeaders = data[0];
  const fullNameIndex = remindHeaders.indexOf(REMINDER_HEADERS.FULL_NAME);
  const remindEmailIndex = remindHeaders.indexOf(REMINDER_HEADERS.EMAIL);
  const functionIndex = remindHeaders.indexOf(REMINDER_HEADERS.PURPOSE);
  const reminderDateIndex = remindHeaders.indexOf(REMINDER_HEADERS.DATE);
  const recurringIndex = remindHeaders.indexOf(REMINDER_HEADERS.RECURRING);

  for (let i = 1; i < data.length; i++) {
    const reminderRow = data[i];
    const reminderDate = new Date(reminderRow[reminderDateIndex]);
    Logger.log(reminderDate);
    if (
      reminderDate.getFullYear() === today.getFullYear() &&
      reminderDate.getMonth() === today.getMonth() &&
      reminderDate.getDate() === today.getDate()
    ) {
      Logger.log(`Reminder - ${reminderRow[fullNameIndex]} | ${reminderRow[functionIndex]}`);
      logActivity(`Reminder - ${reminderRow[fullNameIndex]} | ${reminderRow[functionIndex]}`, reminderDate, reminderRow[remindEmailIndex])
      const recurringType = String(reminderRow[recurringIndex] || '').trim().toLowerCase();
      if (recurringType) {
        // compute next occurrence; ensure it's in the future, even if we missed run
        let next = incrementByRecurrence_(reminderDate, recurringType);
        while (!isAfter_(next, today)) next = incrementByRecurrence_(next, recurringType);
        // write only the Date cell for this row
        remindersSheet.getRange(i + 1, reminderDateIndex + 1).setValue(next);
      }
    }
  }
  return;
}

// ==== recurrence helpers ====
function incrementByRecurrence_(date, recur) {
  // fixed keywords
  if (recur === 'daily')     return addDays_(date, 1);
  if (recur === 'weekly')    return addDays_(date, 7);
  if (recur === 'biweekly') return addDays_(date, 14);
  if (recur === 'monthly')   return addMonthsSafe_(date, 1);
  if (recur === 'quarterly') return addMonthsSafe_(date, 3);
  if (recur === 'semiannual') return addMonthsSafe_(date, 6);
  if (recur === 'annual' || recur === 'yearly') return addMonthsSafe_(date, 12);

  // pattern: "every N days|weeks|months|years"
  const m = recur.match(/^every\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2];
    if (['day','days'].includes(unit))     return addDays_(date, n);
    if (['week','weeks'].includes(unit))   return addDays_(date, n * 7);
    if (['month','months'].includes(unit)) return addMonthsSafe_(date, n);
    if (['year','years'].includes(unit))   return addMonthsSafe_(date, n * 12);
  }
  // unrecognized → do not change
  return date;
}

// ==== date utilities (date-only comparisons; preserves no time) ====
function dateOnly_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function sameDay_(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function isAfter_(a, b) { return dateOnly_(a).getTime() > dateOnly_(b).getTime(); }

function addDays_(d, n) { const t = new Date(d); t.setDate(t.getDate() + n); return dateOnly_(t); }

// Month-end safe adder: if 31st → snap to last day of target month
function addMonthsSafe_(d, n) {
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  const cand = new Date(y, m + n, day);
  const targetMonth = ((m + n) % 12 + 12) % 12;
  if (cand.getMonth() !== targetMonth) return new Date(y, m + n + 1, 0); // last day of target month
  return dateOnly_(cand);
}
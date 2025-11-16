function updateLeadEmailActivity() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Dynamic column detection
  const emailIndex = headers.indexOf(CONTACT_HEADERS.EMAIL);
  const lastContactedIndex = headers.indexOf(CONTACT_HEADERS.LAST_CONTACTED);
  const nextTouchPointIndex = headers.indexOf(CONTACT_HEADERS.NEXT_TOUCH);
  const sentIndex = headers.indexOf(CONTACT_HEADERS.RECENT_EMAIL);
  const receivedIndex = headers.indexOf(CONTACT_HEADERS.LAST_INCOMING);

  if ([emailIndex, lastContactedIndex, nextTouchPointIndex, sentIndex, receivedIndex].includes(-1)) {
    throw new Error("One or more required columns are missing in the 'Leads' sheet.");
  }

  const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000);
  const afterStr = `after:${Math.floor(elevenMinutesAgo.getTime() / 1000)}`; // Gmail uses UNIX timestamps in seconds
  const threads = GmailApp.search(`${afterStr}`);


  const emailActivityMap = {};

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const msg of messages) {
      const msgDate = msg.getDate();
      if (msgDate < elevenMinutesAgo) continue;

      const from = extractEmail(msg.getFrom());
      const toList = msg.getTo().split(',').map(extractEmail);
      const subject = msg.getSubject() || '';
      const body = msg.getPlainBody().slice(0, 5000);

      for (const to of toList) {
        if (!emailActivityMap[to]) emailActivityMap[to] = {};
        if (!emailActivityMap[to].sent || emailActivityMap[to].sent.date < msgDate) {
          emailActivityMap[to].sent = {
            date: msgDate,
            content: `Subject: ${subject}\n\n${body}`
          };
        }
      }
      if (!emailActivityMap[from]) emailActivityMap[from] = {};
      if (!emailActivityMap[from].received || emailActivityMap[from].received.date < msgDate) {
        emailActivityMap[from].received = {
          date: msgDate,
          content: `Subject: ${subject}\n\n${body}`
        };
      }
    }
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const contactEmail = row[emailIndex]?.toLowerCase();
    if (!contactEmail || !emailActivityMap[contactEmail]) continue;

    const activity = emailActivityMap[contactEmail];
    const lastContacted = activity.sent?.date || activity.received?.date || '';
    const { touchOffset = 5 } = getUserSettings(); 
    const nextTouchPoint = lastContacted ? addWeekdays(lastContacted, touchOffset) : '';

    if (lastContacted) sheet.getRange(i + 1, lastContactedIndex + 1).setValue(lastContacted);
    if (nextTouchPoint) sheet.getRange(i + 1, nextTouchPointIndex + 1).setValue(nextTouchPoint);
    if (activity.sent) {
      sheet.getRange(i + 1, sentIndex + 1).setValue(activity.sent.content).setWrap(true);
    }
    if (activity.received) {
      sheet.getRange(i + 1, receivedIndex + 1).setValue(activity.received.content).setWrap(true);
    }
    sheet.setRowHeightsForced(i + 1, 1, 40);
  }
}

function extractEmail(address) {
  const emailMatch = address.match(/<(.+?)>/);
  if (emailMatch) {
    return emailMatch[1].trim().toLowerCase();
  }
  return address.trim().toLowerCase();
}

function addWeekdays(startDate, daysToAdd) {
  let count = 0;
  let date = new Date(startDate);
  while (count < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return date;
}
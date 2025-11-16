function runMailMerge() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName(SHEET_MERGE);
  if (dataSheet) dataSheet.activate(); 
  showTemplatePicker();
}

const normalize = s => s.toString().toLowerCase().replace(/[\s\-_]/g, '');

function showTemplatePicker() {
  const tmplSheet = SpreadsheetApp.getActive().getSheetByName(SHEET_TEMPLATES);
  const rows = tmplSheet.getDataRange().getDisplayValues();
  rows.shift();
  const html = HtmlService.createTemplateFromFile('mergeDialog');
  html.templates = rows;
  html.aliases = Gmail.Users.Settings.SendAs.list('me').sendAs.map(a => a.sendAsEmail);
  SpreadsheetApp.getUi().showModalDialog(html.evaluate().setWidth(650).setHeight(540),'Mail Merge');
}

/** Send or draft – called from modal */
function processMerge(htmlBody, subject, asDraft, senderName, senderEmail) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_MERGE);
  const data = sheet.getDataRange().getValues();
  const header = data.shift();

  // Build map {headerName: columnIndex}
  const col = Object.fromEntries(header.map((h,i)=>[h,i]));

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
  sheet.insertColumnAfter(header.length);
  sheet.getRange(1, header.length + 1).setValue(today);
  col[today] = header.length;
  if (!senderName || senderName === "") {
    senderName = getDefaultSignature();
  }

  let processed = 0;
  data.forEach((row, r) => {
    if (row[col[today]]) return;

    // Respect the Status gate
    const statusCell = (row[col[MERGE_HEADERS.STATUS]] || '').toString().trim().toLowerCase();
    const nowTime    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm');

    const resultCell = sheet.getRange(r + 2, col[today] + 1);

    if (statusCell !== MERGE_STATUS.ACTIVE.toLowerCase()) {
      resultCell.setValue(`Skipped - ${nowTime}`);
      return;
    }
    
    const colRaw     = Object.fromEntries(header.map((h,i)=>[h, i]));
    const colNormKey = Object.fromEntries(header.map((h,i)=>[normalize(h), i]));
    // ----- Active row → compose personalised email -----
    // const filledSubj = substitute(subject,  row, col);
    // const filledBody = substitute(htmlBody, row, col);
    const filledSubj = substitute(subject,  row, colNormKey);
    const filledBody = substitute(htmlBody, row, colNormKey);
    const signature = getDefaultSignature();
    const bodyHTML  = (filledBody + '<br><br>--<br>' + signature).replace(/(\r?\n|\r)/g, '<br>'); 

    if (asDraft) {
      GmailApp.createDraft(row[col.Email], filledSubj, '', {htmlBody: bodyHTML,from: senderEmail, name: senderName});
      resultCell.setValue(`Draft Created - ${nowTime} `);
    } else {
      GmailApp.sendEmail(row[col.Email], filledSubj, '', {htmlBody: bodyHTML, from: senderEmail, name: senderName});
      resultCell.setValue(`Sent - ${nowTime}`);
    }

    Utilities.sleep(1500);
    processed++;
  });

  return processed;
}

/** Replace {{Column}} tags */
function substitute(tpl, row, colMap) {
  return tpl.replace(/{{\s*([^}]+?)\s*}}/g, (_match, rawKey) => {
    const key = normalize(rawKey);
    return (colMap[key] !== undefined) ? row[colMap[key]] : '';
  });
}

function showResultPrompt(count, isDraft) {
  const ui = SpreadsheetApp.getUi();
  const action = isDraft ? 'drafted':'sent';
  ui.alert(`Mail-merge finished`, `${count} emails ${action}.`, ui.ButtonSet.OK);
}

function getDefaultSignature() {
  const aliases = Gmail.Users.Settings.SendAs.list('me').sendAs || [];
  const primary = aliases.find(a => a.isPrimary) || aliases[0];
  return primary && primary.signature ? primary.signature : '';
}

function getDefaultSenderName() {
  const aliases = Gmail.Users.Settings.SendAs.list('me').sendAs || [];
  const primary = aliases.find(a => a.isPrimary) || aliases[0];
  return primary && primary.displayName ? primary.displayName : '';
}
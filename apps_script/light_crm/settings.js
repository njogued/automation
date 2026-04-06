function onOpen() {
  const ui = SpreadsheetApp.getUi()
  
  ui.createAddonMenu()
      .addItem('Start Mail Merge', 'runMailMerge')
      .addItem('Set Permissions', 'runAction')
      .addItem('Update Settings', 'openSettingsSidebar')
      .addItem('Delete Triggers', 'delTriggers')
      .addToUi();

  ui.createMenu('Light CRM')
    .addItem('Start Mail Merge', 'runMailMerge')
    .addItem('Set Permissions', 'runAction')
    .addItem('Update Settings', 'openSettingsSidebar')
    .addItem('Delete Triggers', 'delTriggers')
    .addToUi();
}

function runAction() {
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.send"
  ]);
  PropertiesService.getScriptProperties().setProperty('RUN_ACTION_DONE', 'true');
}

function hasRunActionExecuted() {
  return PropertiesService.getScriptProperties().getProperty('RUN_ACTION_DONE') === "true";
}

function createEmailActivityTrigger(obj) {
  deleteTriggersByHandler_('updateLeadEmailActivity');
  if (obj.enableEmailTracking !== false) {
    ScriptApp.newTrigger('updateLeadEmailActivity')
      .timeBased()
      .everyMinutes(10)
      .create();
    Logger.log('Trigger created.');
  } else {
    Logger.log('Email tracking declined');
  }
}

function openSettingsSidebar() {
  const tmpl = HtmlService.createTemplateFromFile('sidebar');
  tmpl.settings = getUserSettings();
  SpreadsheetApp.getUi()
    .showSidebar(
      tmpl.evaluate()
        .setTitle('CRM Settings')
        .setWidth(320)
    );
}

function saveUserSettings(obj) {
  Logger.log(obj);
  PropertiesService.getScriptProperties()
    .setProperty('CRM_SETTINGS', JSON.stringify(obj));
  createEmailActivityTrigger(obj)
  createOrUpdateDailyTriggers(obj);
  const ui = SpreadsheetApp.getUi()
  ui.alert(
    'Settings Updated',
    'Your settings have been updated',
    ui.ButtonSet.OK
  );
}

// Deletes every trigger in the Apps Script project.
function delTriggers() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    'Delete all triggers',
    'This will remove every trigger in the project. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ui.alert('Success', 'All triggers have been deleted.', ui.ButtonSet.OK);
}

function getColumnHeaders() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers;
}

function getUserSettings() {
  const props = PropertiesService.getScriptProperties();
  return JSON.parse(props.getProperty('CRM_SETTINGS') || '{}');
}

function deleteTriggersByHandler_(handler) {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === handler)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function tester() {
  const scriptProps = PropertiesService.getScriptProperties();
  const recipient = scriptProps.getProperty("REMINDER_EMAIL");
  Logger.log(scriptProps.getProperty('CRM_SETTINGS'));
  const { apiKey = '' } = getUserSettings();
  const { aiModel = '' } = getUserSettings();
  Logger.log(apiKey)
  Logger.log(aiModel)
}
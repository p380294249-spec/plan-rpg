const SPREADSHEET_ID = '1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg';
const SYNC_TOKEN = 'CHANGE_ME_PLAN_RPG_TOKEN';

function doPost(e) {
  const payload = parsePayload_(e);
  if (!payload) return json_({ ok: false, error: 'invalid_payload' });
  if (SYNC_TOKEN && payload.token !== SYNC_TOKEN) return json_({ ok: false, error: 'invalid_token' });

  if (payload.action === 'append_session_log') {
    appendSessionLog_(payload.row || {});
    return json_({ ok: true, action: payload.action });
  }

  if (payload.action === 'ping') {
    appendSetting_('sync_ping', payload.created_at || new Date().toISOString(), 'Ping from Plan RPG web app');
    return json_({ ok: true, action: payload.action });
  }

  return json_({ ok: false, error: 'unknown_action' });
}

function parsePayload_(e) {
  try {
    return JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
  } catch (error) {
    return null;
  }
}

function appendSessionLog_(row) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Session_Logs');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = headers.map(header => row[header] == null ? '' : row[header]);
  sheet.appendRow(values);
}

function appendSetting_(key, value, notes) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Settings');
  sheet.appendRow([key, value, new Date().toISOString(), notes || '']);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


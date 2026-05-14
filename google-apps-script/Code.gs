const SPREADSHEET_ID = '1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg';
const SYNC_TOKEN = 'CHANGE_ME_PLAN_RPG_TOKEN';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (SYNC_TOKEN && params.token !== SYNC_TOKEN) return jsonp_(params.callback, { ok: false, error: 'invalid_token' });

  if (params.action === 'get_session_logs') {
    return jsonp_(params.callback, { ok: true, action: params.action, rows: readRows_('Session_Logs') });
  }

  return jsonp_(params.callback, { ok: false, error: 'unknown_action' });
}

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

function readRows_(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] instanceof Date ? row[index].toISOString() : row[index];
      });
      return obj;
    });
}

function appendSetting_(key, value, notes) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Settings');
  sheet.appendRow([key, value, new Date().toISOString(), notes || '']);
}

function jsonp_(callback, obj) {
  const safeCallback = String(callback || '').match(/^[A-Za-z_$][0-9A-Za-z_$]*$/) ? callback : '';
  if (!safeCallback) return json_(obj);
  return ContentService
    .createTextOutput(safeCallback + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

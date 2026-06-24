const SPREADSHEET_ID = '1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg';
const SYNC_TOKEN = 'plan-rpg-2026';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (SYNC_TOKEN && params.token !== SYNC_TOKEN) return jsonp_(params.callback, { ok: false, error: 'invalid_token' });

  if (params.action === 'get_session_logs') {
    return jsonp_(params.callback, { ok: true, action: params.action, rows: readRows_('Session_Logs') });
  }

  if (params.action === 'get_metric_logs') {
    return jsonp_(params.callback, { ok: true, action: params.action, rows: readRows_('Metric_Logs') });
  }

  if (params.action === 'get_todos') {
    return jsonp_(params.callback, { ok: true, action: params.action, rows: readRows_('Todos') });
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

  if (payload.action === 'append_metric_log') {
    appendMetricLog_(payload.row || {});
    return json_({ ok: true, action: payload.action });
  }

  if (payload.action === 'upsert_todo') {
    upsertTodo_(payload.row || {});
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

function appendMetricLog_(row) {
  const headers = ['metric_log_id', 'date', 'month', 'goal_id', 'metric_type', 'value', 'unit', 'note', 'created_at', 'updated_at'];
  const sheet = ensureSheet_('Metric_Logs', headers);
  const values = headers.map(header => row[header] == null ? '' : row[header]);
  sheet.appendRow(values);
}

function upsertTodo_(row) {
  const headers = ['todo_id', 'category', 'content', 'is_starred', 'is_urgent', 'status', 'created_at', 'completed_at', 'updated_at'];
  const sheet = ensureTodoSheet_(headers);
  const todoId = String(row.todo_id || '');
  if (!todoId) throw new Error('todo_id is required');
  const values = headers.map(header => row[header] == null ? '' : row[header]);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    sheet.appendRow(values);
    return;
  }
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
  const rowIndex = ids.indexOf(todoId);
  if (rowIndex === -1) {
    sheet.appendRow(values);
    return;
  }
  sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([values]);
}

function ensureTodoSheet_(headers) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName('Todos');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Todos');
    sheet.appendRow(headers);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }

  const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  const isCurrentSchema = headers.every((header, index) => existingHeaders[index] === header);
  if (isCurrentSchema) return sheet;

  // The original Todos tab only had empty legacy headers. Migrate it once,
  // but never overwrite a sheet that already contains legacy user rows.
  if (sheet.getLastRow() < 2) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  throw new Error('Todos sheet contains legacy rows and needs a manual migration before sync.');
}

function ensureSheet_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  return sheet;
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

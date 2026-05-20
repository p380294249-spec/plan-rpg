// src/storage/sheet-api.js
// Extracted from index.html during the safe modular refactor.

function readStoredSheetSyncConfig() {
  try {
    return JSON.parse(localStorage.getItem(APP_CONFIG.SHEET_SYNC_CONFIG_KEY) || "null") || null;
  } catch (error) {
    return null;
  }
}

function sheetSyncConfig() {
  const saved = readStoredSheetSyncConfig();
  const isMissing = !saved || !saved.url || !saved.token;
  const legacyTokens = APP_CONFIG.LEGACY_SYNC_TOKENS || [];
  const isLegacyDefault = saved?.url === APP_CONFIG.DEFAULT_GAS_URL && legacyTokens.includes(saved?.token);
  const config = {
    url: saved?.url || APP_CONFIG.DEFAULT_GAS_URL,
    token: isMissing || isLegacyDefault ? APP_CONFIG.DEFAULT_SYNC_TOKEN : saved.token
  };
  if (isMissing || isLegacyDefault) {
    localStorage.setItem(APP_CONFIG.SHEET_SYNC_CONFIG_KEY, JSON.stringify(config));
  }
  return config;
}

function syncTokenCandidates(config = sheetSyncConfig()) {
  const tokens = [config.token || APP_CONFIG.DEFAULT_SYNC_TOKEN];
  if (config.url === APP_CONFIG.DEFAULT_GAS_URL) tokens.push(...(APP_CONFIG.LEGACY_SYNC_TOKENS || []));
  return [...new Set(tokens.filter(Boolean))];
}

async function resolveWorkingSheetToken(config = sheetSyncConfig()) {
  let lastError = null;
  for (const token of syncTokenCandidates(config)) {
    try {
      const payload = await jsonp(config.url, { action: "get_session_logs", token });
      if (payload?.ok) return { token, payload };
      lastError = new Error(payload?.error || "unknown_error");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("sheet_sync_unavailable");
}

function saveSheetSyncConfig() {
  const config = {
    url: $("sheetSyncUrl").value.trim(),
    token: $("sheetSyncToken").value.trim()
  };
  localStorage.setItem(APP_CONFIG.SHEET_SYNC_CONFIG_KEY, JSON.stringify(config));
  renderSheetSyncConfig();
}

function logToSheetRow(log) {
  const quest = questById(log.questId) || {};
  return {
    log_id: log.id,
    date: log.date,
    user: "38029",
    device: navigator.userAgent || "browser",
    goal_id: quest.goal || "",
    quest_id: log.questId,
    task_id: log.actual_task_id || log.taskId,
    gmn: log.gmn,
    minutes: log.minutes,
    what_done: log.whatDone,
    problem: log.problem,
    solution: log.solution,
    good: log.good,
    bad: log.bad,
    next_step: log.nextStep,
    mood_stress: log.moodStress || "",
    skill_xp_json: JSON.stringify(log.skillXp || []),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function sheetRowToLog(row, index = 0) {
  const skillXp = (() => {
    try {
      return row.skill_xp_json ? JSON.parse(row.skill_xp_json) : [];
    } catch (error) {
      return [];
    }
  })();
  return normalizeLog({
    id: row.log_id,
    date: row.date,
    questId: row.quest_id,
    taskId: row.task_id,
    actual_task_id: row.task_id,
    original_task_id: row.task_id,
    gmn: row.gmn,
    minutes: row.minutes,
    whatDone: row.what_done,
    problem: row.problem,
    solution: row.solution,
    good: row.good,
    bad: row.bad,
    nextStep: row.next_step,
    moodStress: row.mood_stress,
    skillXp
  }, index, data.tasks);
}

function mergeRemoteSessionLogs(rows = []) {
  const remoteLogs = rows
    .filter(row => row && row.log_id)
    .map((row, index) => sheetRowToLog(row, index));
  data.logs = remoteLogs.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  save();
  return remoteLogs.length;
}

function metricLogToSheetRow(log) {
  return {
    metric_log_id: log.id,
    date: log.date,
    month: log.month || monthKey(log.date),
    goal_id: log.goalId,
    metric_type: log.metricType,
    value: log.value,
    unit: log.unit,
    note: log.note,
    created_at: log.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function sheetRowToMetricLog(row, index = 0) {
  return normalizeMetricLogs([{
    id: row.metric_log_id,
    date: row.date,
    month: row.month,
    goalId: row.goal_id,
    metricType: row.metric_type,
    value: row.value,
    unit: row.unit,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }])[0] || normalizeMetricLogs([{ id: `ML-REMOTE-${index + 1}` }])[0];
}

function mergeRemoteMetricLogs(rows = []) {
  const remoteLogs = rows
    .filter(row => row && row.metric_log_id)
    .map((row, index) => sheetRowToMetricLog(row, index));
  if (!remoteLogs.length) return 0;
  const beforeIds = new Set(data.metricLogs.map(log => log.id));
  const byId = new Map(data.metricLogs.map(log => [log.id, log]));
  remoteLogs.forEach(log => byId.set(log.id, { ...(byId.get(log.id) || {}), ...log }));
  data.metricLogs = Array.from(byId.values()).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  applyMetricLogsToDashboard();
  save();
  return remoteLogs.filter(log => !beforeIds.has(log.id)).length;
}

function jsonp(url, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `planRpgSheetCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timerId = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, 15000);
    function cleanup() {
      clearTimeout(timerId);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };
    const target = new URL(url);
    Object.entries({ ...params, callback: callbackName }).forEach(([key, value]) => target.searchParams.set(key, value));
    script.onerror = () => {
      cleanup();
      reject(new Error("script_load_failed"));
    };
    script.src = target.toString();
    document.body.appendChild(script);
  });
}

async function pullSessionLogsFromSheet({ silent = false } = {}) {
  const config = sheetSyncConfig();
  if (!config.url) {
    if (!silent) renderSheetSyncConfig("先填写 Apps Script URL。");
    return;
  }
  if (!silent) renderSheetSyncConfig("正在从 Google Sheet 拉取专注记录...");
  try {
    const { payload } = await resolveWorkingSheetToken(config);
    const preserved = preserveLocalSessionLogsBeforeCloudPull(payload.rows || []);
    const cloudCount = mergeRemoteSessionLogs(payload.rows || []);
    renderAll();
    const note = preserved ? ` 已保护 ${preserved} 条本机旧记录，可点“上传本机记录”。` : "";
    renderSheetSyncConfig(`已按 Google Sheet 刷新，共 ${cloudCount} 条云端专注记录。${note}`);
  } catch (error) {
    if (!silent) renderSheetSyncConfig("拉取失败，请确认 Apps Script 已更新并重新部署。");
  }
}

async function uploadLocalSessionLogsToSheet() {
  const config = sheetSyncConfig();
  if (!config.url) {
    renderSheetSyncConfig("先填写 Apps Script URL。");
    return;
  }
  renderSheetSyncConfig("正在检查本机有哪些记录还没进 Google Sheet...");
  let token = config.token || "";
  let cloudRows = [];
  try {
    const resolved = await resolveWorkingSheetToken(config);
    token = resolved.token;
    cloudRows = resolved.payload.rows || [];
  } catch (error) {
    renderSheetSyncConfig("上传失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  preserveLocalSessionLogsBeforeCloudPull(cloudRows);
  const cloudIds = new Set(cloudRows.map(row => row.log_id).filter(Boolean));
  const missing = candidateLocalSessionLogs().filter(log => log.id && !cloudIds.has(log.id));
  if (!missing.length) {
    renderSheetSyncConfig("本机没有需要上传的旧专注记录。");
    return;
  }
  renderSheetSyncConfig(`正在上传 ${missing.length} 条本机旧专注记录...`);
  const uploadedIds = new Set();
  for (const log of missing) {
    const payload = {
      token,
      action: "append_session_log",
      module: "Session_Logs",
      row: logToSheetRow(log)
    };
    try {
      await fetch(config.url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      uploadedIds.add(log.id);
    } catch (error) {
      const pending = JSON.parse(localStorage.getItem(APP_CONFIG.PENDING_SYNC_KEY) || "[]");
      pending.push(payload);
      localStorage.setItem(APP_CONFIG.PENDING_SYNC_KEY, JSON.stringify(pending));
    }
  }
  clearPreservedUploadedLogs(uploadedIds);
  renderSheetSyncConfig(`已发送 ${uploadedIds.size} 条本机旧记录到 Google Sheet。稍等几秒后会自动拉取。`);
  setTimeout(() => pullSessionLogsFromSheet(), 1800);
}

async function syncSessionLogToSheet(log) {
  const config = sheetSyncConfig();
  if (!config.url) {
    renderSheetSyncConfig("未配置 Google Sheet 同步；本次只保存到当前浏览器。");
    return;
  }
  let token = config.token || "";
  try {
    token = (await resolveWorkingSheetToken(config)).token;
  } catch (error) {
    renderSheetSyncConfig("同步失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  const payload = {
    token,
    action: "append_session_log",
    module: "Session_Logs",
    row: logToSheetRow(log)
  };
  try {
    await fetch(config.url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    renderSheetSyncConfig("已发送到 Google Sheet。刷新表格后查看 Session_Logs。");
  } catch (error) {
    const pending = JSON.parse(localStorage.getItem(APP_CONFIG.PENDING_SYNC_KEY) || "[]");
    pending.push(payload);
    localStorage.setItem(APP_CONFIG.PENDING_SYNC_KEY, JSON.stringify(pending));
    renderSheetSyncConfig("同步失败，已暂存到本机待重试队列。");
  }
}

async function pullMetricLogsFromSheet({ silent = false } = {}) {
  const config = sheetSyncConfig();
  if (!config.url) return;
  try {
    const { token } = await resolveWorkingSheetToken(config);
    const payload = await jsonp(config.url, { action: "get_metric_logs", token });
    if (!payload || !payload.ok) throw new Error(payload?.error || "unknown_error");
    const added = mergeRemoteMetricLogs(payload.rows || []);
    renderAll();
    if (!silent) renderSheetSyncConfig(added ? `已从 Google Sheet 拉取 ${added} 条 Metric Log。` : "Metric Log 已同步。");
  } catch (error) {
    if (!silent) renderSheetSyncConfig("Metric Log 拉取失败，请确认 Apps Script 已重新部署。");
  }
}

async function syncMetricLogToSheet(log) {
  const config = sheetSyncConfig();
  if (!config.url) return;
  let token = config.token || "";
  try {
    token = (await resolveWorkingSheetToken(config)).token;
  } catch (error) {
    renderSheetSyncConfig("Metric Log 同步失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  const payload = {
    token,
    action: "append_metric_log",
    module: "Metric_Logs",
    row: metricLogToSheetRow(log)
  };
  try {
    await fetch(config.url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    renderSheetSyncConfig("Metric Log 已发送到 Google Sheet。");
  } catch (error) {
    const pending = JSON.parse(localStorage.getItem(APP_CONFIG.PENDING_SYNC_KEY) || "[]");
    pending.push(payload);
    localStorage.setItem(APP_CONFIG.PENDING_SYNC_KEY, JSON.stringify(pending));
    renderSheetSyncConfig("Metric Log 同步失败，已暂存到本机待重试队列。");
  }
}

async function testSheetSync() {
  const config = sheetSyncConfig();
  if (!config.url) {
    renderSheetSyncConfig("先填写 Apps Script URL。");
    return;
  }
  let token = config.token || "";
  try {
    token = (await resolveWorkingSheetToken(config)).token;
  } catch (error) {
    renderSheetSyncConfig("测试失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  const payload = { token, action: "ping", module: "Settings", created_at: new Date().toISOString() };
  try {
    await fetch(config.url, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    renderSheetSyncConfig("测试请求已发送。去 Google Sheet 的 Settings 查看 sync_ping。");
  } catch (error) {
    renderSheetSyncConfig("测试失败，请检查 URL。");
  }
}

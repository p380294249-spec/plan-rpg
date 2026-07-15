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
  const isLegacyUrl = (APP_CONFIG.LEGACY_GAS_URLS || []).includes(saved?.url);
  const config = {
    url: isLegacyUrl ? APP_CONFIG.DEFAULT_GAS_URL : (saved?.url || APP_CONFIG.DEFAULT_GAS_URL),
    token: isMissing || isLegacyUrl ? APP_CONFIG.DEFAULT_SYNC_TOKEN : saved.token
  };
  if (isMissing || isLegacyUrl) {
    localStorage.setItem(APP_CONFIG.SHEET_SYNC_CONFIG_KEY, JSON.stringify(config));
  }
  return config;
}

function defaultSheetSyncConfig() {
  return {
    url: APP_CONFIG.DEFAULT_GAS_URL,
    token: APP_CONFIG.DEFAULT_SYNC_TOKEN
  };
}

function persistSheetSyncConfig(config) {
  localStorage.setItem(APP_CONFIG.SHEET_SYNC_CONFIG_KEY, JSON.stringify({
    url: config.url || APP_CONFIG.DEFAULT_GAS_URL,
    token: config.token || APP_CONFIG.DEFAULT_SYNC_TOKEN
  }));
}

function syncTokenCandidates(config = sheetSyncConfig()) {
  const tokens = [config.token || APP_CONFIG.DEFAULT_SYNC_TOKEN];
  if (config.url === APP_CONFIG.DEFAULT_GAS_URL) tokens.push(...(APP_CONFIG.LEGACY_SYNC_TOKENS || []));
  return [...new Set(tokens.filter(Boolean))];
}

function sheetSyncConfigCandidates(config = sheetSyncConfig()) {
  const defaults = defaultSheetSyncConfig();
  const candidates = [config || defaults];
  const isDefault = config?.url === defaults.url && config?.token === defaults.token;
  if (!isDefault) candidates.push(defaults);
  const seen = new Set();
  return candidates.filter(candidate => {
    const key = `${candidate.url}::${candidate.token}`;
    if (!candidate.url || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function resolveWorkingSheetToken(config = sheetSyncConfig(), validationAction = "get_session_logs") {
  let lastError = null;
  for (const candidate of sheetSyncConfigCandidates(config)) {
    for (const token of syncTokenCandidates(candidate)) {
      try {
        const payload = await jsonp(candidate.url, { action: validationAction, token });
        if (payload?.ok) {
          const resolvedConfig = { url: candidate.url, token };
          if (candidate.url !== config?.url || token !== config?.token) persistSheetSyncConfig(resolvedConfig);
          return { token, payload, config: resolvedConfig };
        }
        lastError = new Error(payload?.error || "unknown_error");
      } catch (error) {
        lastError = error;
      }
    }
  }
  throw lastError || new Error("sheet_sync_unavailable");
}

function saveSheetSyncConfig() {
  const config = {
    url: $("sheetSyncUrl").value.trim(),
    token: $("sheetSyncToken").value.trim()
  };
  persistSheetSyncConfig(config);
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
    worth_recording: Boolean(log.worthRecording),
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
    worthRecording: row.worth_recording,
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

function todoToSheetRow(todo) {
  return {
    todo_id: todo.id,
    category: todo.category,
    content: todo.content,
    is_starred: Boolean(todo.is_starred),
    is_urgent: Boolean(todo.is_urgent),
    status: todo.status,
    created_at: todo.created_at,
    completed_at: todo.completed_at || "",
    updated_at: todo.updated_at || new Date().toISOString()
  };
}

function gameEventToSheetRow(event) {
  return {
    game_event_id: event.id,
    event_type: event.eventType,
    skill_id: event.skillId,
    mission_type: event.missionType,
    mission_key: event.missionKey,
    reward_instance_id: event.rewardInstanceId,
    reward_id: event.rewardId,
    reward_name: event.rewardName,
    reward_type: event.rewardType,
    rarity: event.rarity,
    status: event.status,
    source_log_id: event.sourceLogId || "",
    payload_json: JSON.stringify(event.payload || {}),
    created_at: event.createdAt || new Date().toISOString(),
    updated_at: event.updatedAt || new Date().toISOString()
  };
}

function sheetRowToTodo(row, index = 0) {
  return normalizeTodos([{
    id: row.todo_id || `TODO-REMOTE-${index + 1}`,
    category: row.category,
    content: row.content,
    is_starred: row.is_starred,
    is_urgent: row.is_urgent,
    status: row.status,
    created_at: row.created_at,
    completed_at: row.completed_at,
    updated_at: row.updated_at
  }])[0];
}

function todoIsNewer(left, right) {
  return String(left?.updated_at || "") > String(right?.updated_at || "");
}

function mergeRemoteTodos(rows = []) {
  const remoteById = new Map();
  rows
    .filter(row => row && row.todo_id)
    .map((row, index) => sheetRowToTodo(row, index))
    .forEach(todo => {
      const current = remoteById.get(todo.id);
      if (!current || todoIsNewer(todo, current)) remoteById.set(todo.id, todo);
    });

  const localById = new Map(data.todos.map(todo => [todo.id, todo]));
  const merged = new Map(localById);
  const uploads = [];
  remoteById.forEach(remoteTodo => {
    const localTodo = localById.get(remoteTodo.id);
    if (!localTodo || todoIsNewer(remoteTodo, localTodo) || remoteTodo.updated_at === localTodo.updated_at) {
      merged.set(remoteTodo.id, remoteTodo);
    } else {
      uploads.push(localTodo);
    }
  });
  localById.forEach((localTodo, id) => {
    if (!remoteById.has(id)) uploads.push(localTodo);
  });
  data.todos = Array.from(merged.values()).sort((left, right) => String(right.updated_at || "").localeCompare(String(left.updated_at || "")));
  save();
  return { remoteCount: remoteById.size, uploads };
}

function sheetRowToGameEvent(row, index = 0) {
  return normalizeGameEvents([{
    id: row.game_event_id || `GE-REMOTE-${index + 1}`,
    eventType: row.event_type,
    skillId: row.skill_id,
    missionType: row.mission_type,
    missionKey: row.mission_key,
    rewardInstanceId: row.reward_instance_id,
    rewardId: row.reward_id,
    rewardName: row.reward_name,
    rewardType: row.reward_type,
    rarity: row.rarity,
    status: row.status,
    sourceLogId: row.source_log_id,
    payload_json: row.payload_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }])[0];
}

function mergeRemoteGameEvents(rows = []) {
  const remoteEvents = rows
    .filter(row => row && row.game_event_id)
    .map((row, index) => sheetRowToGameEvent(row, index));
  if (!remoteEvents.length) return 0;
  const byId = new Map((data.gameEvents || []).map(event => [event.id, event]));
  remoteEvents.forEach(event => byId.set(event.id, { ...(byId.get(event.id) || {}), ...event }));
  data.gameEvents = Array.from(byId.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  save();
  return remoteEvents.length;
}

function readPendingSyncQueue() {
  try {
    return JSON.parse(localStorage.getItem(APP_CONFIG.PENDING_SYNC_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function savePendingSyncQueue(items = []) {
  localStorage.setItem(APP_CONFIG.PENDING_SYNC_KEY, JSON.stringify(items));
}

function pendingPayloadKey(payload) {
  const row = payload?.row || {};
  const rowId = row.game_event_id || row.todo_id || row.log_id || row.metric_log_id || payload.created_at || "";
  return `${payload?.action || "unknown"}:${rowId}`;
}

function queuePendingSyncPayload(payload) {
  const key = pendingPayloadKey(payload);
  const pending = readPendingSyncQueue().filter(item => pendingPayloadKey(item) !== key);
  pending.push(payload);
  savePendingSyncQueue(pending);
}

async function postSheetPayload(config, payload) {
  await fetch(config.url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
}

async function sendTodoPayload(config, payload) {
  try {
    const response = await jsonp(config.url, {
      action: "upsert_todo",
      token: payload.token,
      row: JSON.stringify(payload.row || {})
    });
    if (!response || !response.ok) throw new Error(response?.error || "todo_upsert_failed");
    return response;
  } catch (error) {
    await postSheetPayload(config, payload);
    return { ok: true, fallback: true };
  }
}

async function sendGameEventPayload(config, payload) {
  try {
    const response = await jsonp(config.url, {
      action: "upsert_game_event",
      token: payload.token,
      row: JSON.stringify(payload.row || {})
    });
    if (!response || !response.ok) throw new Error(response?.error || "game_event_upsert_failed");
    return response;
  } catch (error) {
    await postSheetPayload(config, payload);
    return { ok: true, fallback: true };
  }
}

async function flushPendingSyncQueue({ silent = false } = {}) {
  const pending = readPendingSyncQueue();
  if (!pending.length) return 0;
  const config = sheetSyncConfig();
  if (!config.url) return 0;
  const resolvedByAction = new Map();
  const remaining = [];
  let sentCount = 0;
  for (const payload of pending) {
    try {
      const validationAction = validationActionForPayload(payload);
      let resolved = resolvedByAction.get(validationAction);
      if (!resolved) {
        resolved = await resolveWorkingSheetToken(config, validationAction);
        resolvedByAction.set(validationAction, resolved);
      }
      const nextPayload = { ...payload, token: payload.token || resolved.token };
      const workingConfig = resolved.config;
      if (nextPayload.action === "upsert_todo") await sendTodoPayload(workingConfig, nextPayload);
      else if (nextPayload.action === "upsert_game_event") await sendGameEventPayload(workingConfig, nextPayload);
      else await postSheetPayload(workingConfig, nextPayload);
      sentCount += 1;
    } catch (error) {
      remaining.push(payload);
    }
  }
  savePendingSyncQueue(remaining);
  if (sentCount && !silent) renderSheetSyncConfig(`已自动补传 ${sentCount} 条本机待同步数据。`);
  return sentCount;
}

function validationActionForPayload(payload = {}) {
  if (payload.action === "upsert_game_event") return "get_game_events";
  if (payload.action === "upsert_todo") return "get_todos";
  if (payload.action === "append_metric_log") return "get_metric_logs";
  return "get_session_logs";
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
  let workingConfig = config;
  let cloudRows = [];
  try {
    const resolved = await resolveWorkingSheetToken(config);
    token = resolved.token;
    workingConfig = resolved.config;
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
      await postSheetPayload(workingConfig, payload);
      uploadedIds.add(log.id);
    } catch (error) {
      queuePendingSyncPayload(payload);
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
  let workingConfig = config;
  try {
    const resolved = await resolveWorkingSheetToken(config);
    token = resolved.token;
    workingConfig = resolved.config;
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
    await postSheetPayload(workingConfig, payload);
    renderSheetSyncConfig("已发送到 Google Sheet。刷新表格后查看 Session_Logs。");
  } catch (error) {
    queuePendingSyncPayload(payload);
    renderSheetSyncConfig("同步失败，已暂存到本机待重试队列。");
  }
}

async function pullMetricLogsFromSheet({ silent = false } = {}) {
  const config = sheetSyncConfig();
  if (!config.url) return;
  try {
    const resolved = await resolveWorkingSheetToken(config, "get_metric_logs");
    const payload = await jsonp(resolved.config.url, { action: "get_metric_logs", token: resolved.token });
    if (!payload || !payload.ok) throw new Error(payload?.error || "unknown_error");
    const added = mergeRemoteMetricLogs(payload.rows || []);
    renderAll();
    if (!silent) renderSheetSyncConfig(added ? `已从 Google Sheet 拉取 ${added} 条 Metric Log。` : "Metric Log 已同步。");
  } catch (error) {
    if (!silent) renderSheetSyncConfig("Metric Log 拉取失败，请确认 Apps Script 已重新部署。");
  }
}

async function pullTodosFromSheet({ silent = false } = {}) {
  const config = sheetSyncConfig();
  if (!config.url) return;
  try {
    const resolved = await resolveWorkingSheetToken(config, "get_todos");
    const payload = await jsonp(resolved.config.url, { action: "get_todos", token: resolved.token });
    if (!payload || !payload.ok) throw new Error(payload?.error || "unknown_error");
    const { remoteCount, uploads } = mergeRemoteTodos(payload.rows || []);
    renderAll();
    for (const todo of uploads) await syncTodoToSheet(todo, { token: resolved.token, config: resolved.config, silent: true });
    if (!silent) {
      const uploadNote = uploads.length ? `，已补传 ${uploads.length} 条本机待办` : "";
      renderSheetSyncConfig(`Todo 已同步，共 ${remoteCount} 条云端待办${uploadNote}。`);
    }
  } catch (error) {
    if (!silent) renderSheetSyncConfig("Todo 同步失败，请确认 Apps Script 已更新并重新部署。");
  }
}

async function pullGameEventsFromSheet({ silent = false } = {}) {
  const config = sheetSyncConfig();
  if (!config.url) return;
  try {
    const resolved = await resolveWorkingSheetToken(config, "get_game_events");
    const payload = await jsonp(resolved.config.url, { action: "get_game_events", token: resolved.token });
    if (!payload || !payload.ok) throw new Error(payload?.error || "unknown_error");
    const count = mergeRemoteGameEvents(payload.rows || []);
    renderAll();
    if (!silent) renderSheetSyncConfig(count ? `Game Events 已同步 ${count} 条。` : "Game Events 已同步。");
  } catch (error) {
    if (!silent) renderSheetSyncConfig("Game Events 同步失败，请确认 Apps Script 已更新并重新部署。");
  }
}

async function syncMetricLogToSheet(log) {
  const config = sheetSyncConfig();
  if (!config.url) return;
  let token = config.token || "";
  let workingConfig = config;
  try {
    const resolved = await resolveWorkingSheetToken(config, "get_metric_logs");
    token = resolved.token;
    workingConfig = resolved.config;
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
    await postSheetPayload(workingConfig, payload);
    renderSheetSyncConfig("Metric Log 已发送到 Google Sheet。");
  } catch (error) {
    queuePendingSyncPayload(payload);
    renderSheetSyncConfig("Metric Log 同步失败，已暂存到本机待重试队列。");
  }
}

async function syncTodoToSheet(todo, { token = "", config: providedConfig = null, silent = false } = {}) {
  const config = providedConfig || sheetSyncConfig();
  if (!config.url) return;
  let workingToken = token;
  let workingConfig = config;
  try {
    if (!workingToken || !providedConfig) {
      const resolved = await resolveWorkingSheetToken(config, "get_todos");
      workingToken = workingToken || resolved.token;
      workingConfig = resolved.config;
    }
  } catch (error) {
    if (!silent) renderSheetSyncConfig("Todo 同步失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  const payload = {
    token: workingToken,
    action: "upsert_todo",
    module: "Todos",
    row: todoToSheetRow(todo)
  };
  try {
    const response = await sendTodoPayload(workingConfig, payload);
    if (!silent) renderSheetSyncConfig(response.fallback ? "Todo 已发送到 Google Sheet，稍后会自动校验。" : "Todo 已同步到 Google Sheet。");
  } catch (error) {
    queuePendingSyncPayload(payload);
    if (!silent) renderSheetSyncConfig("Todo 同步失败，已暂存到本机待重试队列。");
  }
}

async function syncGameEventToSheet(event, { token = "", config: providedConfig = null, silent = false } = {}) {
  const config = providedConfig || sheetSyncConfig();
  if (!config.url) return;
  let workingToken = token;
  let workingConfig = config;
  try {
    if (!workingToken || !providedConfig) {
      const resolved = await resolveWorkingSheetToken(config, "get_game_events");
      workingToken = workingToken || resolved.token;
      workingConfig = resolved.config;
    }
  } catch (error) {
    if (!silent) renderSheetSyncConfig("Game Event 同步失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  const payload = {
    token: workingToken,
    action: "upsert_game_event",
    module: "Game_Events",
    row: gameEventToSheetRow(event)
  };
  try {
    await sendGameEventPayload(workingConfig, payload);
    if (!silent) renderSheetSyncConfig("Game Event 已同步到 Google Sheet。");
  } catch (error) {
    queuePendingSyncPayload(payload);
    if (!silent) renderSheetSyncConfig("Game Event 同步失败，已暂存到本机待重试队列。");
  }
}

async function testSheetSync() {
  const config = sheetSyncConfig();
  if (!config.url) {
    renderSheetSyncConfig("先填写 Apps Script URL。");
    return;
  }
  let token = config.token || "";
  let workingConfig = config;
  try {
    const resolved = await resolveWorkingSheetToken(config);
    token = resolved.token;
    workingConfig = resolved.config;
  } catch (error) {
    renderSheetSyncConfig("测试失败：Apps Script URL 或 Token 不可用。");
    return;
  }
  const payload = { token, action: "ping", module: "Settings", created_at: new Date().toISOString() };
  try {
    await postSheetPayload(workingConfig, payload);
    renderSheetSyncConfig("测试请求已发送。去 Google Sheet 的 Settings 查看 sync_ping。");
  } catch (error) {
    renderSheetSyncConfig("测试失败，请检查 URL。");
  }
}

// src/storage/local-cache.js
// Extracted from index.html during the safe modular refactor.

function readMapCollapseState() {
  const defaults = { life: true, campaigns: true, chapters: true, tasks: false };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(APP_CONFIG.MAP_COLLAPSE_STATE_KEY) || "{}") };
  } catch (error) {
    return defaults;
  }
}

function saveMapCollapseState(state) {
  localStorage.setItem(APP_CONFIG.MAP_COLLAPSE_STATE_KEY, JSON.stringify(state));
}

function loadData() {
  const current = JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEY) || "null");
  if (current) return normalizeData(current);
  const legacy = JSON.parse(localStorage.getItem(APP_CONFIG.LEGACY_KEY) || "null");
  if (!legacy) return normalizeData(seed);
  const migrated = structuredClone(seed);
  if (Array.isArray(legacy.logs)) migrated.logs = legacy.logs.map((log, index) => normalizeLog(log, index, migrated.tasks));
  return normalizeData(migrated);
}

function normalizeData(raw) {
  const merged = { ...structuredClone(seed), ...raw };
  merged.goals2030 = normalizeGoals(mergeById(seed.goals2030, merged.goals2030 || []));
  merged.quests = normalizeQuests(mergeById(seed.quests, merged.quests || []));
  merged.tasks = normalizeTasks(mergeById(seed.tasks, merged.tasks || []));
  merged.logs = (merged.logs || []).map((log, index) => normalizeLog(log, index, merged.tasks));
  merged.metricLogs = normalizeMetricLogs(merged.metricLogs || []);
  merged.todos = normalizeTodos(merged.todos || []);
  applyMetricLogsToDashboard(merged.metricLogs, merged);
  return merged;
}

function mergeById(defaultRows, savedRows) {
  const rows = [...defaultRows];
  savedRows.forEach(row => {
    const index = rows.findIndex(item => item.id === row.id);
    if (index >= 0) rows[index] = { ...rows[index], ...row };
    else rows.push(row);
  });
  return rows;
}

function normalizeGoals(goals) {
  return goals.filter(goal => goal.id !== "READ").map(goal => {
    const fixed = seed.goals2030.find(item => item.id === goal.id);
    if (!fixed) return goal;
    return {
      ...goal,
      title: fixed.title,
      targetValue: fixed.targetValue,
      unit: fixed.unit,
      role: fixed.role,
      displayTitle: fixed.displayTitle
    };
  });
}

function normalizeTodos(todos) {
  return todos.map((todo, index) => {
    const suggestion = classifyTodo(`${todo.title || ""} ${todo.note || ""}`);
    return {
      id: todo.id || `TODO-${index + 1}`,
      title: todo.title || "",
      note: todo.note || "",
      dueDate: todo.dueDate || todayISO(),
      priority: todo.priority || "medium",
      status: todo.status || "open",
      questId: todo.questId || suggestion.questId,
      gmn: todo.gmn || suggestion.gmn,
      createdAt: todo.createdAt || new Date().toISOString(),
      convertedTaskId: todo.convertedTaskId || ""
    };
  });
}

function normalizeQuests(quests) {
  return quests.map(quest => {
    const fixed = seed.quests.find(item => item.id === quest.id);
    if (!fixed) return quest;
    return {
      ...quest,
      parentQuestId: fixed.parentQuestId,
      name: fixed.name,
      type: fixed.type,
      goal: fixed.goal,
      target: fixed.target,
      description: fixed.description,
      nextMove: fixed.nextMove,
      unit: fixed.unit,
      targetValue: fixed.targetValue,
      icon: fixed.icon,
      priority: fixed.priority,
      status: quest.status || fixed.status,
      gmn: quest.gmn || fixed.gmn
    };
  });
}

function normalizeTasks(tasks) {
  return tasks.map(task => {
    const fixed = seed.tasks.find(item => item.id === task.id);
    const base = {
      is_random_event: false,
      quest_type: questTypeFromQuestId(fixed?.questId || task.questId),
      estimated_sessions: 1,
      reason: "",
      source: "manual",
      linked_goal_id: "",
      priority: (task.priority || "medium").toLowerCase(),
      pivot_status: "none",
      original_title: task.name,
      current_title: task.name,
      pivot_reason: "",
      discovery_note: "",
      generated_task_id: ""
    };
    if (fixed && !task.is_random_event) {
      return {
        ...base,
        ...task,
        ...fixed,
        current_title: fixed.name,
        original_title: fixed.name,
        minutes: Number(fixed.minutes || 20),
        quest_type: fixed.quest_type || questTypeFromQuestId(fixed.questId)
      };
    }
    return { ...base, ...task, minutes: Number(task.minutes || 20) };
  });
}

function normalizeLog(log, index, tasks = seed.tasks) {
  const task = taskByIdFromRows(log.taskId, tasks);
  return {
    id: log.id || `L-${String(index + 1).padStart(3, "0")}`,
    date: log.date || new Date().toISOString().slice(0, 10),
    minutes: Number(log.minutes || 20),
    gmn: log.gmn || task?.gmn || "G",
    questId: log.questId || task?.questId || "Q-009",
    taskId: log.taskId || "T-003",
    whatDone: log.whatDone || "",
    problem: log.problem || "",
    solution: log.solution || "",
    good: log.good || "",
    bad: log.bad || "",
    nextStep: log.nextStep || "",
    moodStress: log.moodStress || log.mood_stress || "",
    skillXp: log.skillXp || buildSkillXp(task || seed.tasks[2]),
    is_random_event: Boolean(log.is_random_event || task?.is_random_event),
    is_pivoted: Boolean(log.is_pivoted),
    original_task_id: log.original_task_id || log.taskId || "T-003",
    actual_task_id: log.actual_task_id || log.taskId || "T-003",
    pivot_note: log.pivot_note || ""
  };
}

function normalizeMetricLogs(metricLogs) {
  return metricLogs.map((log, index) => ({
    id: log.id || `ML-${String(index + 1).padStart(3, "0")}`,
    date: log.date || todayISO(),
    goalId: log.goalId || log.goal_id || "BUSINESS",
    metricType: log.metricType || log.metric_type || "Metric",
    value: Number(log.value || 0),
    unit: log.unit || "",
    note: log.note || "",
    month: log.month || String(log.date || todayISO()).slice(0, 7),
    createdAt: log.createdAt || log.created_at || new Date().toISOString(),
    updatedAt: log.updatedAt || log.updated_at || new Date().toISOString()
  }));
}

function taskByIdFromSeed(id) {
  return seed.tasks.find(t => t.id === id);
}

function taskByIdFromRows(id, rows) {
  return rows.find(t => t.id === id) || taskByIdFromSeed(id);
}

function save() {
  data.version = APP_CONFIG.VERSION;
  localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(data));
}

function readPreservedLocalSessionLogs() {
  try {
    return JSON.parse(localStorage.getItem(APP_CONFIG.LOCAL_UNSYNCED_LOGS_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function savePreservedLocalSessionLogs(logs = []) {
  const byId = new Map();
  logs
    .filter(log => log && log.id)
    .map((log, index) => normalizeLog(log, index, data.tasks))
    .forEach(log => byId.set(log.id, log));
  localStorage.setItem(APP_CONFIG.LOCAL_UNSYNCED_LOGS_KEY, JSON.stringify(Array.from(byId.values())));
}

function preserveLocalSessionLogsBeforeCloudPull(remoteRows = []) {
  const cloudIds = new Set(remoteRows.map(row => row.log_id).filter(Boolean));
  const localOnly = data.logs.filter(log => log?.id && !cloudIds.has(log.id));
  if (!localOnly.length) return 0;
  const existing = readPreservedLocalSessionLogs();
  savePreservedLocalSessionLogs([...existing, ...localOnly]);
  return localOnly.length;
}

function clearPreservedUploadedLogs(uploadedIds = new Set()) {
  if (!uploadedIds.size) return;
  const remaining = readPreservedLocalSessionLogs().filter(log => !uploadedIds.has(log.id));
  savePreservedLocalSessionLogs(remaining);
}

function candidateLocalSessionLogs() {
  const byId = new Map();
  [...readPreservedLocalSessionLogs(), ...data.logs].forEach((log, index) => {
    if (log?.id) byId.set(log.id, normalizeLog(log, index, data.tasks));
  });
  return Array.from(byId.values());
}

function saveDraft() {
  localStorage.setItem(APP_CONFIG.FOCUS_DRAFT_KEY, JSON.stringify({ taskId: selectedTaskId, ...readForm() }));
  $("sessionResult").innerHTML = `<span class="pill">草稿已保存</span><h3>可以先离开</h3><p>当前记录已暂存在本机浏览器，完成后再结算。</p>`;
}

function exportData() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), app: "Plan RPG", version: APP_CONFIG.VERSION, data }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `plan-rpg-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parsed.data || parsed;
      data = normalizeData(imported);
      save();
      renderAll();
      alert("导入完成。");
    } catch (error) {
      alert("导入失败：JSON 文件格式不正确。");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

// src/storage/local-cache.js
// Extracted from index.html during the safe modular refactor.

function readMapCollapseState() {
  const defaults = { life: true, campaigns: true, chapters: true };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(APP_CONFIG.MAP_COLLAPSE_STATE_KEY) || "{}") };
  } catch (error) {
    return defaults;
  }
}

function saveMapCollapseState(state) {
  localStorage.setItem(APP_CONFIG.MAP_COLLAPSE_STATE_KEY, JSON.stringify(state));
}

function readTodoUiState() {
  const defaults = { category: "DFK", filter: "ALL", isStarred: false, isUrgent: false };
  try {
    const saved = JSON.parse(localStorage.getItem(APP_CONFIG.TODO_UI_STATE_KEY) || "{}");
    return {
      category: ["DFK", "INSO", "OTHER"].includes(saved.category) ? saved.category : defaults.category,
      filter: ["ALL", "DFK", "INSO", "OTHER"].includes(saved.filter) ? saved.filter : defaults.filter,
      isStarred: Boolean(saved.isStarred),
      isUrgent: Boolean(saved.isUrgent)
    };
  } catch (error) {
    return defaults;
  }
}

function saveTodoUiState(state) {
  localStorage.setItem(APP_CONFIG.TODO_UI_STATE_KEY, JSON.stringify(state));
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
  merged.gameEvents = normalizeGameEvents(merged.gameEvents || merged.game?.events || []);
  applyMetricLogsToDashboard(merged.metricLogs, merged);
  return merged;
}

function isMergedMindsetQuestId(questId) {
  return MINDSET_MERGED_QUEST_IDS.includes(questId);
}

function isMergedMindsetTaskId(taskId) {
  return MINDSET_MERGED_TASK_IDS.includes(taskId);
}

function mergedMindsetQuestId(questId) {
  return isMergedMindsetQuestId(questId) ? MINDSET_CANONICAL_QUEST_ID : questId;
}

function mergedMindsetTaskId(taskId) {
  return isMergedMindsetTaskId(taskId) ? MINDSET_CANONICAL_TASK_ID : taskId;
}

function mergedDfkQuestId(questId) {
  return DFK_LEGACY_QUEST_MAP[questId] || questId;
}

function isMergedDfkQuestId(questId) {
  return Boolean(DFK_LEGACY_QUEST_MAP[questId]);
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
    const createdAt = todo.created_at || todo.createdAt || new Date().toISOString();
    const legacyStatus = String(todo.status || "pending").toLowerCase();
    const status = legacyStatus === "done" ? "done" : (legacyStatus === "cancelled" || legacyStatus === "deleted" ? "cancelled" : "pending");
    return {
      id: todo.id || `TODO-${index + 1}`,
      category: normalizeTodoCategory(todo),
      content: todo.content || todo.title || "",
      is_starred: normalizeTodoBoolean(todo.is_starred ?? todo.isStarred ?? ["high", "urgent"].includes(String(todo.priority || "").toLowerCase())),
      is_urgent: normalizeTodoBoolean(todo.is_urgent ?? todo.isUrgent ?? String(todo.priority || "").toLowerCase() === "urgent"),
      status,
      created_at: createdAt,
      completed_at: status === "done" ? (todo.completed_at || todo.completedAt || todo.updated_at || todo.updatedAt || createdAt) : "",
      updated_at: todo.updated_at || todo.updatedAt || createdAt
    };
  });
}

function normalizeTodoBoolean(value) {
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return Boolean(value);
}

function normalizeTodoCategory(todo) {
  if (["DFK", "INSO", "OTHER"].includes(todo.category)) return todo.category;
  if (["Q-003", "Q-011", "Q-012", "Q-013"].includes(todo.questId)) return "INSO";
  if (["Q-001", "Q-009", "Q-010", "Q-016", "Q-018", "Q-019"].includes(todo.questId)) return "DFK";
  const text = `${todo.content || ""} ${todo.title || ""}`.toUpperCase();
  if (text.includes("INSO") || text.includes("RFQ") || text.includes("报价") || text.includes("客户")) return "INSO";
  if (text.includes("DFK") || text.includes("财务") || text.includes("打印") || text.includes("货柜")) return "DFK";
  return "OTHER";
}

function normalizeQuests(quests) {
  return quests.filter(quest => !isMergedMindsetQuestId(quest.id) && !isMergedDfkQuestId(quest.id)).map(quest => {
    const fixed = seed.quests.find(item => item.id === quest.id);
    if (!fixed) return quest;
    const renamedDfkModule = ["Q-009", "Q-010", "Q-016"].includes(quest.id) && quest.name !== fixed.name;
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
      monthlyMetric: Boolean(fixed.monthlyMetric),
      status: quest.status || fixed.status,
      gmn: renamedDfkModule ? fixed.gmn : (quest.gmn || fixed.gmn)
    };
  });
}

function normalizeTasks(tasks) {
  return tasks.filter(task => !isMergedMindsetTaskId(task.id)).map(task => {
    const fixed = seed.tasks.find(item => item.id === task.id);
    const normalizedQuestId = mergedDfkQuestId(task.questId);
    const base = {
      is_random_event: false,
      quest_type: questTypeFromQuestId(fixed?.questId || normalizedQuestId),
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
    return { ...base, ...task, questId: normalizedQuestId, minutes: Number(task.minutes || 20) };
  });
}

function normalizeLog(log, index, tasks = seed.tasks) {
  const normalizedTaskId = mergedMindsetTaskId(log.actual_task_id || log.taskId);
  const normalizedQuestId = mergedDfkQuestId(mergedMindsetQuestId(log.questId));
  const task = taskByIdFromRows(normalizedTaskId || log.taskId, tasks);
  return {
    id: log.id || `L-${String(index + 1).padStart(3, "0")}`,
    date: log.date || new Date().toISOString().slice(0, 10),
    minutes: Number(log.minutes || 20),
    gmn: log.gmn || task?.gmn || "G",
    questId: normalizedQuestId || task?.questId || "Q-009",
    taskId: normalizedTaskId || log.taskId || "T-003",
    whatDone: log.whatDone || "",
    problem: log.problem || "",
    solution: log.solution || "",
    good: log.good || "",
    bad: log.bad || "",
    nextStep: log.nextStep || "",
    moodStress: log.moodStress || log.mood_stress || "",
    skillXp: log.skillXp || buildSkillXp(task || seed.tasks[2]),
    worthRecording: Boolean(log.worthRecording || log.worth_recording === true || String(log.worth_recording || "").toLowerCase() === "true"),
    is_random_event: Boolean(log.is_random_event || task?.is_random_event),
    is_pivoted: Boolean(log.is_pivoted),
    original_task_id: mergedMindsetTaskId(log.original_task_id || log.taskId || "T-003"),
    actual_task_id: normalizedTaskId || log.taskId || "T-003",
    pivot_note: log.pivot_note || ""
  };
}

function normalizeMetricLogs(metricLogs) {
  return metricLogs.map((log, index) => ({
    id: log.id || `ML-${String(index + 1).padStart(3, "0")}`,
    date: log.date || todayISO(),
    goalId: log.goalId === "READ" || log.goal_id === "READ" ? "MINDSET" : (log.goalId || log.goal_id || "BUSINESS"),
    metricType: log.metricType || log.metric_type || "Metric",
    value: Number(log.value || 0),
    unit: log.unit || "",
    note: log.note || "",
    month: log.month || String(log.date || todayISO()).slice(0, 7),
    createdAt: log.createdAt || log.created_at || new Date().toISOString(),
    updatedAt: log.updatedAt || log.updated_at || new Date().toISOString()
  }));
}

function normalizeGameEvents(events) {
  return (events || []).filter(Boolean).map((event, index) => {
    const createdAt = event.createdAt || event.created_at || new Date().toISOString();
    const payload = (() => {
      if (typeof event.payload === "object" && event.payload !== null) return event.payload;
      try {
        return event.payload_json ? JSON.parse(event.payload_json) : {};
      } catch (error) {
        return {};
      }
    })();
    return {
      id: event.id || event.event_id || `GE-${String(index + 1).padStart(3, "0")}`,
      eventType: event.eventType || event.event_type || "reward_drawn",
      skillId: event.skillId || event.skill_id || "FOCUS",
      missionType: event.missionType || event.mission_type || "",
      missionKey: event.missionKey || event.mission_key || "",
      rewardInstanceId: event.rewardInstanceId || event.reward_instance_id || "",
      rewardId: event.rewardId || event.reward_id || "",
      rewardName: event.rewardName || event.reward_name || "",
      rewardType: event.rewardType || event.reward_type || "",
      rarity: GAME_RARITIES.includes(event.rarity) ? event.rarity : "Common",
      status: event.status || "saved",
      sourceLogId: event.sourceLogId || event.source_log_id || "",
      payload,
      createdAt,
      updatedAt: event.updatedAt || event.updated_at || createdAt
    };
  });
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
  $("sessionResult").classList.remove("hide");
  $("sessionResult").innerHTML = `<span class="pill">草稿已保存</span>`;
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

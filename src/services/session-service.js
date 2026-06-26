// src/services/session-service.js
// Extracted from index.html during the safe modular refactor.

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function valueProgress(row) {
  const target = Number(row?.targetValue || 0);
  if (!target) return null;
  return Math.max(0, Math.min(100, Math.round((Number(row.currentValue || 0) / target) * 100)));
}

function monthKey(date = todayISO()) {
  return String(date || todayISO()).slice(0, 7);
}

function yearKey(date = todayISO()) {
  return String(date || todayISO()).slice(0, 4);
}

function dateAfter(left, right) {
  return String(left || "") > String(right || "");
}

function weekIndexInYear(date = todayISO()) {
  const value = String(date || todayISO()).slice(0, 10);
  const start = new Date(`${value.slice(0, 4)}-01-01T00:00:00`);
  const current = new Date(`${value}T12:00:00`);
  const day = Math.floor((current - start) / 86400000) + 1;
  return Math.max(1, Math.ceil(day / 7));
}

function metricQuestIdFor(goalId, metricType = "", targetData = data) {
  const value = String(metricType).toLowerCase();
  const has = (...words) => words.some(word => value.includes(word.toLowerCase()));
  if (goalId === "HEALTH" || has("weight", "体重", "kg")) return "Q-005";
  if (goalId === "MINDSET" || goalId === "READ") return "Q-004";
  if (has("good things", "smile", "好事", "开心", "bad things", "bad", "坏事", "教训", "meditation", "冥想", "thought", "想法", "book", "read", "reading", "读书", "读完")) return "Q-004";
  if (goalId === "PASSIVE" || has("汇款", "remittance", "transfer")) return "Q-002";
  if (goalId === "NEW" || has("ai", "mvp", "automation", "自动化")) return "Q-008";
  if (has("rfq", "order", "income", "收入", "客户", "customer", "contact")) return "Q-003";
  if (has("container", "柜", "profit", "salary", "dfk")) return "Q-001";
  return targetData?.quests?.find(q => !q.parentQuestId && q.goal === goalId)?.id || "";
}

function isMonthlyMetricQuest(questOrId, targetData = data) {
  const quest = typeof questOrId === "string"
    ? targetData?.quests?.find(item => item.id === questOrId)
    : questOrId;
  return Boolean(quest?.monthlyMetric);
}

function metricLogsForQuest(questId, { month = "", year = "" } = {}, targetData = data) {
  return (targetData?.metricLogs || []).filter(log => {
    if (metricQuestIdFor(log.goalId, log.metricType, targetData) !== questId) return false;
    if (month && monthKey(log.date) !== month) return false;
    if (year && yearKey(log.date) !== year) return false;
    return true;
  });
}

function metricTotalForQuest(questId, filters = {}, targetData = data) {
  return metricLogsForQuest(questId, filters, targetData)
    .reduce((sum, log) => sum + Number(log.value || 0), 0);
}

function monthlyMetricSummary(questOrId, targetData = data) {
  const quest = typeof questOrId === "string"
    ? targetData?.quests?.find(item => item.id === questOrId)
    : questOrId;
  if (!quest) return { value: 0, target: 0, unit: "", progress: 0 };
  const value = metricTotalForQuest(quest.id, { month: monthKey() }, targetData);
  const target = Number(quest.targetValue || 0);
  return {
    value,
    target,
    unit: String(quest.unit || "").replace(/\/月$/, ""),
    progress: target ? Math.max(0, Math.min(100, Math.round((value / target) * 100))) : 0
  };
}

function annualMetricTotal(questOrId, targetData = data) {
  const questId = typeof questOrId === "string" ? questOrId : questOrId?.id;
  return metricTotalForQuest(questId, { year: yearKey() }, targetData);
}

function applyMetricLogsToDashboard(metricLogs = data.metricLogs || [], targetData = data) {
  const currentMonth = monthKey();
  const monthly = metricLogs.filter(log => monthKey(log.date) === currentMonth);
  targetData.quests
    .filter(quest => isMonthlyMetricQuest(quest, targetData))
    .forEach(quest => { quest.currentValue = 0; });
  const totals = new Map();
  monthly.forEach(log => {
    const questId = metricQuestIdFor(log.goalId, log.metricType, targetData);
    if (!questId) return;
    const current = totals.get(questId) || { questId, value: 0, unit: log.unit };
    current.value += Number(log.value || 0);
    if (log.unit) current.unit = log.unit;
    totals.set(questId, current);
  });
  totals.forEach(total => {
    const quest = targetData.quests?.find(item => item.id === total.questId);
    if (quest) {
      quest.currentValue = total.value;
      quest.unit = total.unit || quest.unit;
      if (total.value > 0 && quest.status === "Not Started") quest.status = "In Progress";
      if (quest.goal !== "BUSINESS") {
        const goal = targetData.goals2030?.find(item => item.id === quest.goal);
        if (goal) {
          goal.currentValue = total.value;
          goal.unit = total.unit || goal.unit;
        }
      }
    }
  });
  applyHealthWeightProgress(targetData);
  applyMindsetMeditationProgress(targetData);
}

function isHealthWeightMetric(log, targetData = data) {
  return log.goalId === "HEALTH" || metricQuestIdFor(log.goalId, log.metricType, targetData) === "Q-005";
}

function isWeightInHealthRange(value, targetData = data) {
  const goal = targetData.goals2030?.find(item => item.id === "HEALTH");
  const quest = targetData.quests?.find(item => item.id === "Q-005");
  const base = Number(quest?.baseWeightKg || goal?.baseWeightKg || 72);
  const tolerance = Number(quest?.toleranceKg || goal?.toleranceKg || 5);
  const weight = Number(value);
  return Number.isFinite(weight) && weight >= base - tolerance && weight <= base + tolerance;
}

function applyHealthWeightProgress(targetData = data) {
  const quest = targetData.quests?.find(item => item.id === "Q-005");
  const goal = targetData.goals2030?.find(item => item.id === "HEALTH");
  if (!quest && !goal) return;
  const baseline = Math.max(Number(quest?.baselineValue || 0), Number(goal?.baselineValue || 0));
  const baselineThrough = quest?.baselineThrough || goal?.baselineThrough || "2026-06-11";
  const targetYear = yearKey(baselineThrough);
  const completedWeeks = new Set();
  (targetData.metricLogs || [])
    .filter(log => isHealthWeightMetric(log, targetData))
    .filter(log => yearKey(log.date) === targetYear)
    .filter(log => dateAfter(log.date, baselineThrough))
    .filter(log => isWeightInHealthRange(log.value, targetData))
    .forEach(log => completedWeeks.add(`${targetYear}-W${weekIndexInYear(log.date)}`));
  const current = baseline + completedWeeks.size;
  [quest, goal].filter(Boolean).forEach(row => {
    row.currentValue = current;
    row.targetValue = 52;
    row.unit = "周";
  });
}

function applyMindsetMeditationProgress(targetData = data) {
  const quest = targetData.quests?.find(item => item.id === MINDSET_CANONICAL_QUEST_ID);
  const goal = targetData.goals2030?.find(item => item.id === "MINDSET");
  if (!quest && !goal) return;
  const sessionCount = (targetData.logs || []).filter(log => log.questId === MINDSET_CANONICAL_QUEST_ID || log.taskId === MINDSET_CANONICAL_TASK_ID || log.actual_task_id === MINDSET_CANONICAL_TASK_ID).length;
  const metricCount = (targetData.metricLogs || [])
    .filter(log => log.goalId === "MINDSET" || log.goalId === "READ" || metricQuestIdFor(log.goalId, log.metricType, targetData) === MINDSET_CANONICAL_QUEST_ID)
    .reduce((sum, log) => sum + Math.max(1, Number(log.value || 1)), 0);
  const baseline = Math.max(Number(quest?.baselineValue || 0), Number(goal?.baselineValue || 0));
  const current = baseline + sessionCount + metricCount;
  if (quest) {
    quest.currentValue = current;
    quest.unit = "次";
  }
  if (goal) {
    goal.currentValue = current;
    goal.unit = "次";
  }
}

function displayProgress(row) {
  const valueBased = valueProgress(row);
  return valueBased === null ? Number(row?.progress || 0) : valueBased;
}

function goalProgress(goal) {
  const campaigns = campaignQuestsForGoal(goal.id);
  const metricCampaigns = campaigns.filter(q => valueProgress(q) !== null);
  if (metricCampaigns.length) {
    return Math.round(metricCampaigns.reduce((sum, q) => sum + valueProgress(q), 0) / metricCampaigns.length);
  }
  return displayProgress(goal);
}

function overallAnnualProgress() {
  const topLevel = data.quests.filter(q => !q.parentQuestId && valueProgress(q) !== null);
  if (topLevel.length) {
    return Math.round(topLevel.reduce((sum, q) => sum + valueProgress(q), 0) / topLevel.length);
  }
  return data.quests.reduce((s, q) => s + computedQuestProgress(q), 0) / data.quests.length;
}

function computedQuestProgress(q) {
  const valueBased = valueProgress(q);
  if (valueBased !== null) return valueBased;
  const tasks = tasksForQuest(q.id);
  if (!tasks.length) return q.status === "In Progress" ? 35 : 8;
  const done = data.logs.filter(l => l.questId === q.id).length;
  return Math.min(100, Math.round((done / Math.max(tasks.length, 1)) * 100));
}

function computedTaskProgress(task) {
  return task.status === "Done" || data.logs.some(l => (l.actual_task_id || l.taskId) === task.id) ? 100 : 0;
}

function buildSkillXp(task) {
  const base = task.gmn === "G" ? 30 : task.gmn === "M" ? 15 : 0;
  return (task.skillIds || ["personal-system"]).map((skillId, index) => ({ skillId, xp: index === 0 ? base : Math.max(5, Math.round(base / 3)) }));
}

function isMeditationTask(task) {
  return task?.questId === MINDSET_CANONICAL_QUEST_ID || task?.id === MINDSET_CANONICAL_TASK_ID || isMergedMindsetTaskId(task?.id);
}

function taskDefaultMinutes(task) {
  return Math.min(180, Math.max(1, Math.round(Number(task?.minutes || 20))));
}

function selectedDurationMinutes() {
  const t = taskById(selectedTaskId);
  const value = Number($("durationInput")?.value || t?.minutes || 20);
  return Math.min(180, Math.max(1, Math.round(value)));
}

function setTimerForTask(task, force = false) {
  const minutes = Number(task?.minutes || 20);
  if (!force && (running || timerSessionActive)) return;
  if (force || timerTaskId !== task.id) {
    timerTaskId = task.id;
    timerSessionActive = false;
    seconds = minutes * 60;
    timerEndsAt = 0;
    if ($("durationInput")) $("durationInput").value = String(Math.max(1, minutes));
  }
}

function startQuickMetricFromQuest(questId) {
  const config = quickMetricConfigForQuest(questId);
  if (!config) return;
  selectedQuestId = questId;
  selectedGoalId = config.goalId;
  showScreen("focus");
  populateMetricGoalSelect();
  setRecordType("metric");
  $("metricLogDate").value = todayISO();
  $("metricLogGoal").value = config.goalId;
  $("metricLogType").value = config.metricType;
  $("metricLogUnit").value = config.unit;
  $("metricLogValue").focus();
}

function startDefaultRecordFromDetail() {
  if (isMetricOnlyQuest(selectedQuestId)) {
    startQuickMetricFromQuest(selectedQuestId);
    return;
  }
  const tasks = tasksForQuest(selectedQuestId);
  const current = taskById(selectedTaskId);
  const task = current && current.questId === selectedQuestId ? current : tasks[0];
  if (!task) return;
  if (!confirmStartNewSession(task.id)) return;
  selectedTaskId = task.id;
  const minutes = taskDefaultMinutes(task);
  setTimerForTask({ ...task, minutes }, true);
  showScreen("focus");
  if ($("durationInput")) $("durationInput").value = String(minutes);
  seconds = minutes * 60;
  renderTimer();
  if (!running) toggleTimer();
}

function confirmStartNewSession(nextTaskId) {
  if (!timerSessionActive || !timerTaskId) return true;
  if (timerTaskId === nextTaskId) {
    showScreen("focus");
    return false;
  }
  const current = taskById(timerTaskId);
  const next = taskById(nextTaskId);
  const choice = prompt(
    `已有一个进行中的记录：${current?.current_title || current?.name || "当前任务"}\n\n输入 1：回到之前的计时\n输入 2：先结束之前的记录，再开始「${next?.current_title || next?.name || "新任务"}」\n输入 3：放弃之前的计时，开始新记录`,
    "1"
  );
  if (choice === "1" || choice === null || choice === "") {
    selectedTaskId = timerTaskId;
    const task = taskById(timerTaskId);
    if (task) {
      selectedQuestId = task.questId;
      syncGoalForQuest(selectedQuestId);
    }
    showScreen("focus");
    return false;
  }
  if (choice === "2") {
    pendingAfterSessionSave = nextTaskId;
    selectedTaskId = timerTaskId;
    const task = taskById(timerTaskId);
    if (task) {
      selectedQuestId = task.questId;
      syncGoalForQuest(selectedQuestId);
    }
    showScreen("focus");
    alert("请先补充当前记录，然后点击「完成并结算」。结算后会自动开始新记录。");
    return false;
  }
  if (choice === "3") {
    abandonActiveSession();
    return true;
  }
  return false;
}

function abandonActiveSession() {
  running = false;
  timerSessionActive = false;
  clearInterval(timer);
  timer = null;
  timerEndsAt = 0;
  timerTaskId = "";
  seconds = selectedDurationMinutes() * 60;
  localStorage.removeItem(APP_CONFIG.FOCUS_DRAFT_KEY);
  renderTimer();
}

function cancelActiveSessionWithConfirm() {
  const task = taskById(timerTaskId || selectedTaskId);
  const minutes = taskDefaultMinutes(task);
  if (!confirm(`确定取消当前 ${minutes} 分钟专注吗？这次不会保存为完成记录。`)) return;
  abandonActiveSession();
  renderActiveTimerPanel();
  renderTimer();
}

function continuePendingSessionIfNeeded() {
  if (!pendingAfterSessionSave) return;
  const nextTaskId = pendingAfterSessionSave;
  pendingAfterSessionSave = null;
  const task = taskById(nextTaskId);
  if (!task) return;
  selectedTaskId = task.id;
  selectedQuestId = task.questId;
  syncGoalForQuest(selectedQuestId);
  const minutes = taskDefaultMinutes(task);
  setTimerForTask({ ...task, minutes }, true);
  showScreen("focus");
  if ($("durationInput")) $("durationInput").value = String(minutes);
  seconds = minutes * 60;
  renderTimer();
  if (!running) toggleTimer();
}

function syncTimerWithClock() {
  if (!running || !timerEndsAt) return;
  const remainingMs = Math.max(0, timerEndsAt - Date.now());
  seconds = Math.ceil(remainingMs / 1000);
  renderTimer();
  if (remainingMs <= 0) {
    const completedTask = taskById(timerTaskId || selectedTaskId);
    const shouldAutoSaveMeditation = isMeditationTask(completedTask);
    running = false;
    clearInterval(timer);
    timer = null;
    timerEndsAt = 0;
    seconds = 0;
    if (shouldAutoSaveMeditation) {
      timerSessionActive = false;
      selectedTaskId = completedTask.id;
      selectedQuestId = completedTask.questId;
      syncGoalForQuest(selectedQuestId);
      saveSession();
      return;
    }
    if (completedTask) {
      timerSessionActive = true;
      selectedTaskId = completedTask.id;
      selectedQuestId = completedTask.questId;
      syncGoalForQuest(selectedQuestId);
    }
    renderTimer();
  }
}

function toggleTimer() {
  if (running) {
    syncTimerWithClock();
    running = false;
    clearInterval(timer);
    timer = null;
    timerEndsAt = 0;
  } else {
    if (seconds <= 0) seconds = selectedDurationMinutes() * 60;
    running = true;
    timerSessionActive = true;
    timerEndsAt = Date.now() + seconds * 1000;
    syncTimerWithClock();
    timer = setInterval(syncTimerWithClock, 250);
  }
  renderTimer();
}

function resetTimer() {
  running = false;
  timerSessionActive = false;
  clearInterval(timer);
  timer = null;
  timerEndsAt = 0;
  seconds = selectedDurationMinutes() * 60;
  renderTimer();
}

function readForm() {
  const t = taskById(selectedTaskId);
  const q = questById(t.questId);
  const meditation = isMeditationTask(t);
  const feeling = $("problem").value.trim();
  return {
    id: newId("L"),
    date: new Date().toISOString().slice(0, 10),
    minutes: selectedDurationMinutes(),
    gmn: t.gmn,
    questId: q.id,
    taskId: t.id,
    whatDone: $("whatDone").value.trim() || (isMeditationTask(t) ? "完成一次冥想" : (t.current_title || t.name)),
    problem: feeling,
    solution: meditation ? "" : $("solution").value.trim(),
    good: meditation ? "" : $("good").value.trim(),
    bad: meditation ? "" : $("bad").value.trim(),
    nextStep: meditation ? ($("nextStep").value.trim() || "下次继续短冥想") : ($("nextStep").value.trim() || q.nextMove),
    moodStress: meditation ? feeling : $("moodStress").value.trim(),
    skillXp: buildSkillXp(t),
    is_random_event: Boolean(t.is_random_event),
    is_pivoted: false,
    original_task_id: t.original_task_id || t.id,
    actual_task_id: t.id,
    pivot_note: ""
  };
}

function saveMetricLog() {
  const goalId = $("metricLogGoal").value || selectedGoalId;
  const metricType = $("metricLogType").value.trim();
  const value = Number($("metricLogValue").value || 0);
  if (!metricType) {
    alert("先填写 Metric Type。");
    return;
  }
  if (!Number.isFinite(value)) {
    alert("Value 必须是数字。");
    return;
  }
  const statusNote = goalId === "HEALTH" && metricQuestIdFor(goalId, metricType) === "Q-005"
    ? (isWeightInHealthRange(value) ? "达标：在 67-77KG 范围内。" : "未达标：超出 67-77KG 范围。")
    : "";
  const note = $("metricLogNote").value.trim();
  const log = {
    id: newId("ML"),
    date: $("metricLogDate").value || todayISO(),
    goalId,
    metricType,
    value,
    unit: $("metricLogUnit").value.trim(),
    note: [statusNote, note].filter(Boolean).join(" "),
    month: monthKey($("metricLogDate").value || todayISO()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.metricLogs.unshift(log);
  selectedGoalId = goalId;
  applyMetricLogsToDashboard();
  save();
  clearMetricLogForm();
  renderAll();
  syncMetricLogToSheet(log);
  showScreen("map");
}

function clearMetricLogForm() {
  $("metricLogDate").value = todayISO();
  $("metricLogType").value = "";
  $("metricLogValue").value = "";
  $("metricLogUnit").value = "";
  $("metricLogNote").value = "";
}

function saveSession() {
  const log = readForm();
  data.logs.unshift(log);
  const task = taskById(log.actual_task_id || log.taskId);
  if (task) task.status = "Done";
  applySkillXp(log.skillXp);
  lastSession = log;
  save();
  clearForm();
  resetTimer();
  renderAll();
  renderSessionResult(log);
  syncSessionLogToSheet(log);
  continuePendingSessionIfNeeded();
}

function applySkillXp(events) {
  events.forEach(event => {
    const skill = skillById(event.skillId);
    if (!skill) return;
    skill.xp += event.xp;
    while (skill.xp >= skill.maxXp) {
      skill.xp -= skill.maxXp;
      skill.level += 1;
      skill.maxXp = Math.round(skill.maxXp * 1.25);
    }
  });
}

function parseLogDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfWeek(date = new Date()) {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

function weekRange(weeksAgo = 0) {
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() - weeksAgo * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function logsForWeek(weeksAgo = 0) {
  const range = weekRange(weeksAgo);
  return data.logs.filter(log => {
    const date = parseLogDate(log.date);
    return date && date >= range.start && date <= range.end;
  });
}

function totalMinutesOf(logs = []) {
  return logs.reduce((sum, log) => sum + Number(log.minutes || 0), 0);
}

function formatShortDate(date) {
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function formatMinuteDelta(delta) {
  if (!delta) return "0 min";
  return `${delta > 0 ? "+" : ""}${delta} min`;
}

function directionLabelForWeek(logs, minutes) {
  if (!logs.length) return "待开始";
  const growthMinutes = totalMinutesOf(logs.filter(log => log.gmn === "G"));
  const ratio = minutes ? growthMinutes / minutes : 0;
  if (ratio >= 0.6) return "方向稳定";
  if (ratio >= 0.35) return "稍微偏了";
  return "明显偏离";
}

function collectTopAreas(logs = []) {
  const buckets = new Map();
  logs.forEach(log => {
    const quest = questById(log.questId);
    const label = quest?.name || log.questId;
    const current = buckets.get(label) || { label, minutes: 0, count: 0, nextMove: quest?.nextMove || "" };
    current.minutes += Number(log.minutes || 0);
    current.count += 1;
    buckets.set(label, current);
  });
  return Array.from(buckets.values()).sort((a, b) => b.minutes - a.minutes).slice(0, 4);
}

function collectUniqueNotes(logs, field) {
  return [...new Set(logs.map(log => String(log[field] || "").trim()).filter(Boolean))].slice(0, 6);
}

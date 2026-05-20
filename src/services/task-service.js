// src/services/task-service.js
// Extracted from index.html during the safe modular refactor.

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function questTypeFromQuestId(questId) {
  const q = seed.quests.find(item => item.id === questId);
  if (!q) return "side";
  if (q.type === "Main") return "main";
  if (q.type === "Habit") return "maintenance";
  return "side";
}

function questTypeForTask(task) {
  if (!task) return "side";
  if (task.is_random_event && !["Promoted", "Filed as Maintenance", "Filed as Noise"].includes(task.status)) return "emergency";
  if (task.pivot_status && task.pivot_status !== "none") return "pivot";
  return task.quest_type || questTypeFromQuestId(task.questId);
}

function questTypeForQuest(quest) {
  const tasks = tasksForQuest(quest.id);
  const random = tasks.some(t => t.is_random_event);
  const pivot = tasks.some(t => t.pivot_status && t.pivot_status !== "none");
  if (random) return "emergency";
  if (pivot) return "pivot";
  return questTypeFromQuestId(quest.id);
}

function typeBadge(type) {
  return ({
    main: "主线",
    side: "支线",
    maintenance: "维护",
    noise: "噪音",
    emergency: "突发",
    pivot: "转向"
  })[type] || "支线";
}

function roleBadge(role) {
  return ({
    Mainline: "主线",
    Habit: "习惯",
    Sideline: "支线",
    Life: "生活"
  })[role] || role || "目标";
}

function gmnText(gmn) {
  return ({ G: "G 成长", M: "M 维护", N: "N 噪音" })[gmn] || gmn || "G 成长";
}

function gmnClass(gmn) {
  return `gmn-${String(gmn || "G").toLowerCase()}`;
}

function typeClass(type) {
  return `type-${type || "side"}`;
}

function questGoalIds(quest) {
  return String(quest?.goal || "").split("/").map(id => id.trim()).filter(Boolean);
}

function questMatchesGoal(quest, goalId) {
  return questGoalIds(quest).includes(goalId);
}

function rootQuestId(questId) {
  let quest = questById(questId);
  const seen = new Set();
  while (quest?.parentQuestId && !seen.has(quest.id)) {
    seen.add(quest.id);
    quest = questById(quest.parentQuestId);
  }
  return quest?.id || questId;
}

function syncGoalForQuest(questId) {
  const quest = questById(questId);
  const firstGoal = questGoalIds(quest)[0];
  if (firstGoal) selectedGoalId = firstGoal;
  selectedCampaignId = rootQuestId(questId) || selectedCampaignId;
}

function campaignQuestsForGoal(goalId) {
  return data.quests.filter(q => !q.parentQuestId && questMatchesGoal(q, goalId));
}

function chapterQuestsForCampaign(campaignId) {
  const collect = (parentId, depth = 0) => data.quests
    .filter(q => q.parentQuestId === parentId)
    .flatMap(q => [{ ...q, mapDepth: depth }, ...collect(q.id, depth + 1)]);
  const chapters = collect(campaignId);
  return chapters.length ? chapters : data.quests.filter(q => q.id === campaignId);
}

function questIdForType(type, goalId = "") {
  if (type === "main") {
    if (goalId === "PASSIVE") return "Q-002";
    if (goalId === "BUSINESS") return "Q-001";
    return "Q-001";
  }
  if (type === "maintenance") return "Q-005";
  if (type === "noise") return "Q-008";
  return "Q-009";
}

function quickMetricConfigForQuest(questId) {
  if (questId === "Q-001") {
    return { label: "记录装柜数量", goalId: "BUSINESS", metricType: "装柜数量", unit: "柜" };
  }
  if (questId === "Q-003") {
    return { label: "记录 INSO 收入", goalId: "BUSINESS", metricType: "INSO 收入", unit: "RMB" };
  }
  return null;
}

function openRandomEventModal() {
  $("randomGoal").innerHTML = `<option value="">不关联</option>` + data.goals2030.map(g => `<option value="${g.id}">${g.id} · ${escapeHtml(g.title)}</option>`).join("");
  $("randomEventModal").classList.remove("hide");
  $("randomTitle").focus();
}

function classifyTodo(text) {
  const value = String(text || "").toLowerCase();
  const has = (...words) => words.some(word => value.includes(word.toLowerCase()));
  if (has("汇款流程", "通道规则", "收款流程")) return { questId: "Q-014", gmn: "G", reason: "汇款流程/通道系统" };
  if (has("汇款客户", "稳定客户", "银行", "汇款", "收款", "付款", "通道", "bank", "payment")) return { questId: "Q-015", gmn: "M", reason: "汇款系统/客户维护" };
  if (has("订单", "rfq", "报价", "询价", "采购", "成交", "元器件", "ic", "bom")) return { questId: "Q-011", gmn: "G", reason: "INSO 订单跟进" };
  if (has("麦穗", "开发客户", "新客户", "linkedin", "whatsapp", "邮件开发", "google", "搜索", "销售")) return { questId: "Q-012", gmn: "G", reason: "INSO 客户开发" };
  if (has("联系客户", "老客户", "跟进客户", "客户关系", "定期互动", "客户状态")) return { questId: "Q-013", gmn: "M", reason: "INSO 客户维护" };
  if (has("打印", "标签", "单据")) return { questId: "Q-018", gmn: "G", reason: "DFK 打印系统" };
  if (has("人员", "岗位", "交接", "员工")) return { questId: "Q-019", gmn: "G", reason: "DFK 人员管理" };
  if (has("财务", "利润", "对账", "成本", "费用")) return { questId: "Q-010", gmn: "G", reason: "DFK 财务系统" };
  if (has("物流", "发货", "货柜", "船", "资料", "报关", "仓库", "广州", "义乌")) return { questId: "Q-009", gmn: "G", reason: "DFK 稳定系统" };
  if (has("推广", "培训", "sop", "系统", "流程", "记录")) return { questId: "Q-016", gmn: "G", reason: "DFK 培训/系统" };
  if (has("冥想", "焦虑", "呼吸", "冷静")) return { questId: "Q-004", gmn: "G", reason: "心态成长" };
  if (has("健康", "体重", "训练", "饮食", "健身")) return { questId: "Q-005", gmn: "G", reason: "健康系统" };
  if (has("女朋友", "girlfriend", "约会", "旅行", "旅游")) return { questId: "Q-021", gmn: "M", reason: "Family / girl friend" };
  if (has("优化ai", "优化自动化", "流程优化")) return { questId: "Q-026", gmn: "G", reason: "AI 自动化优化" };
  if (has("推销ai", "ai方案", "案例", "演示")) return { questId: "Q-027", gmn: "G", reason: "AI 自动化可推销方案" };
  if (has("ai", "自动化", "自动", "mvp", "工作流", "省时间", "脚本")) return { questId: "Q-024", gmn: "G", reason: "AI 工作自动化" };
  if (has("咖啡", "兴趣", "爱好")) return { questId: "Q-007", gmn: "M", reason: "兴趣/爱好" };
  if (has("体验", "第一次", "新事物")) return { questId: "Q-008", gmn: "M", reason: "新体验" };
  return { questId: "Q-009", gmn: "M", reason: "默认进入 DFK 稳定系统，稍后手动归类" };
}

function questPathLabel(questId) {
  const parts = [];
  let quest = questById(questId);
  const seen = new Set();
  while (quest && !seen.has(quest.id)) {
    seen.add(quest.id);
    parts.unshift(quest.name);
    quest = quest.parentQuestId ? questById(quest.parentQuestId) : null;
  }
  return parts.join(" / ");
}

function questDepth(questId) {
  let depth = 0;
  let quest = questById(questId);
  const seen = new Set();
  while (quest?.parentQuestId && !seen.has(quest.id)) {
    seen.add(quest.id);
    depth += 1;
    quest = questById(quest.parentQuestId);
  }
  return depth;
}

function goalIdForQuestId(questId) {
  return questGoalIds(questById(questId))[0] || "BUSINESS";
}

function populateTodoGoalSelect(goalId = $("todoGoal")?.value || selectedGoalId) {
  $("todoGoal").innerHTML = data.goals2030.map(goal => `<option value="${goal.id}">${goalLabel(goal)}</option>`).join("");
  $("todoGoal").value = data.goals2030.some(goal => goal.id === goalId) ? goalId : "BUSINESS";
}

function populateTodoQuestSelect(goalId = $("todoGoal")?.value || "BUSINESS", selectedQuestId = $("todoQuest")?.value) {
  const quests = data.quests.filter(q => questMatchesGoal(q, goalId));
  $("todoQuest").innerHTML = quests.map(q => {
    const prefix = "- ".repeat(questDepth(q.id));
    return `<option value="${q.id}">${escapeHtml(prefix + questPathLabel(q.id))}</option>`;
  }).join("");
  const fallback = quests[0]?.id || "";
  $("todoQuest").value = quests.some(q => q.id === selectedQuestId) ? selectedQuestId : fallback;
}

function setTodoClassification(questId, gmn = $("todoGmn").value) {
  const goalId = goalIdForQuestId(questId);
  populateTodoGoalSelect(goalId);
  populateTodoQuestSelect(goalId, questId);
  $("todoGmn").value = gmn;
}

function updateTodoSuggestion(apply = false) {
  const text = `${$("todoTitle").value} ${$("todoNote").value}`;
  const suggestion = classifyTodo(text);
  const quest = questById(suggestion.questId);
  if (apply) setTodoClassification(suggestion.questId, suggestion.gmn);
  $("todoSuggestion").innerHTML = `<b>归类建议</b><p>${escapeHtml(questPathLabel(suggestion.questId) || quest?.name || suggestion.questId)} · ${suggestion.gmn} · ${escapeHtml(suggestion.reason)}</p>`;
}

function applyTodoSuggestion() {
  updateTodoSuggestion(true);
}

function createTodo() {
  const title = $("todoTitle").value.trim();
  if (!title) {
    alert("先写一个待办事项。");
    return;
  }
  const todo = {
    id: newId("TODO"),
    title,
    note: $("todoNote").value.trim(),
    dueDate: $("todoDueDate").value || todayISO(),
    priority: $("todoPriority").value,
    status: "open",
    questId: $("todoQuest").value,
    gmn: $("todoGmn").value,
    createdAt: new Date().toISOString(),
    convertedTaskId: ""
  };
  data.todos.unshift(todo);
  clearTodoForm();
  save();
  renderAll();
  showScreen("todos");
}

function clearTodoForm() {
  $("todoTitle").value = "";
  $("todoNote").value = "";
  $("todoDueDate").value = todayISO();
  $("todoPriority").value = "medium";
  setTodoClassification("Q-001", "G");
  updateTodoSuggestion();
}

function startTodo(todoId) {
  const todo = data.todos.find(item => item.id === todoId);
  if (!todo) return;
  let task = todo.convertedTaskId ? taskById(todo.convertedTaskId) : null;
  if (!task) {
    task = {
      id: newId("T-TODO"),
      questId: todo.questId,
      name: todo.title,
      current_title: todo.title,
      original_title: todo.title,
      instruction: todo.note || todo.title,
      minutes: 20,
      standard: "完成并记录这条待办",
      gmn: todo.gmn,
      skillIds: todo.gmn === "G" ? ["operations", "strategy"] : ["personal-system"],
      status: "Not Started",
      is_random_event: false,
      quest_type: questTypeFromQuestId(todo.questId),
      estimated_sessions: 1,
      reason: "待办收件箱",
      source: "todo",
      linked_goal_id: questGoalIds(questById(todo.questId))[0] || selectedGoalId,
      priority: todo.priority,
      pivot_status: "none",
      pivot_reason: "",
      discovery_note: "",
      generated_task_id: "",
      source_todo_id: todo.id
    };
    data.tasks.unshift(task);
    todo.convertedTaskId = task.id;
  }
  todo.status = "started";
  selectedTaskId = task.id;
  selectedQuestId = task.questId;
  syncGoalForQuest(selectedQuestId);
  save();
  renderAll();
  showScreen("focus");
}

function finishTodo(todoId) {
  const todo = data.todos.find(item => item.id === todoId);
  if (!todo) return;
  todo.status = "done";
  save();
  renderAll();
}

function moveTodoLater(todoId) {
  const todo = data.todos.find(item => item.id === todoId);
  if (!todo) return;
  const date = new Date();
  date.setDate(date.getDate() + 1);
  todo.dueDate = date.toISOString().slice(0, 10);
  todo.status = "open";
  save();
  renderAll();
}

function deleteTodo(todoId) {
  const todo = data.todos.find(item => item.id === todoId);
  if (!todo || !confirm("确定删除这条待办吗？")) return;
  todo.status = "deleted";
  save();
  renderAll();
}

function createRandomEvent(startNow = false) {
  const title = $("randomTitle").value.trim();
  const reason = $("randomReason").value.trim();
  if (!title || !reason) {
    alert("请至少填写任务标题和为什么要做。");
    return;
  }
  const questType = $("randomQuestType").value;
  const goalId = $("randomGoal").value;
  const gmn = $("randomGmn").value;
  const task = {
    id: newId("T-RND"),
    questId: questIdForType(questType, goalId),
    name: title,
    instruction: $("randomDescription").value.trim() || reason,
    minutes: 20,
    standard: `完成 ${Math.max(1, Number($("randomEstimated").value || 1))} 个 session 并记录结果`,
    gmn,
    skillIds: gmn === "G" ? ["operations", "strategy"] : ["personal-system"],
    status: "Not Started",
    is_random_event: true,
    quest_type: questType,
    estimated_sessions: Math.max(1, Number($("randomEstimated").value || 1)),
    reason,
    source: $("randomSource").value,
    linked_goal_id: goalId,
    priority: $("randomPriority").value,
    pivot_status: "none",
    original_title: title,
    current_title: title,
    pivot_reason: "",
    discovery_note: "",
    generated_task_id: ""
  };
  data.tasks.unshift(task);
  selectedTaskId = task.id;
  selectedQuestId = task.questId;
  selectedGoalId = goalId || questGoalIds(questById(task.questId))[0] || selectedGoalId;
  closeModal("randomEventModal");
  clearRandomEventForm();
  save();
  renderAll();
  if (startNow) showScreen("focus");
}

function createQuickTask() {
  const title = $("quickTaskTitle").value.trim();
  if (!title) {
    alert("先写一个任务标题。");
    return;
  }
  const q = questById(selectedQuestId);
  const gmn = $("quickTaskGmn").value;
  const minutes = Math.min(180, Math.max(1, Math.round(Number($("quickTaskMinutes").value || 20))));
  const task = {
    id: newId("T-CUSTOM"),
    questId: q.id,
    name: title,
    current_title: title,
    original_title: title,
    instruction: $("quickTaskNote").value.trim() || title,
    minutes,
    standard: "完成并记录这次行动",
    gmn,
    skillIds: gmn === "G" ? ["operations", "strategy"] : ["personal-system"],
    status: "Not Started",
    is_random_event: false,
    quest_type: questTypeFromQuestId(q.id),
    estimated_sessions: 1,
    reason: "手动新增",
    source: "manual",
    linked_goal_id: questGoalIds(q)[0] || selectedGoalId,
    priority: "medium",
    pivot_status: "none",
    pivot_reason: "",
    discovery_note: "",
    generated_task_id: ""
  };
  data.tasks.unshift(task);
  selectedTaskId = task.id;
  selectedQuestId = task.questId;
  syncGoalForQuest(selectedQuestId);
  save();
  renderAll();
  showScreen("focus");
}

function updateQuestMetric(questId) {
  const quest = questById(questId);
  if (!quest) return;
  const current = Number($("metricCurrent").value || 0);
  const target = Number($("metricTarget").value || 0);
  if (target <= 0) {
    alert("目标值必须大于 0。");
    return;
  }
  quest.currentValue = current;
  quest.targetValue = target;
  save();
  renderAll();
}

function updateTaskGmn(taskId, gmn) {
  const task = taskById(taskId);
  if (!task || !["G", "M", "N"].includes(gmn)) return;
  task.gmn = gmn;
  if (!task.is_random_event) task.quest_type = questTypeFromQuestId(task.questId);
  save();
  renderAll();
}

function updateQuestGmn(questId, gmn) {
  const quest = questById(questId);
  if (!quest || !["G", "M", "N"].includes(gmn)) return;
  quest.gmn = gmn;
  save();
  renderAll();
}

function classifyRandomEvent(taskId, type) {
  const task = taskById(taskId);
  if (!task) return;
  task.quest_type = type;
  task.questId = questIdForType(type, task.linked_goal_id);
  task.status = type === "noise" ? "Filed as Noise" : type === "maintenance" ? "Filed as Maintenance" : "Promoted";
  if (selectedTaskId === task.id) {
    selectedQuestId = task.questId;
    selectedGoalId = task.linked_goal_id || questGoalIds(questById(task.questId))[0] || selectedGoalId;
  }
  save();
  renderAll();
}

function clearRandomEventForm() {
  ["randomTitle", "randomReason", "randomDescription"].forEach(id => $(id).value = "");
  $("randomQuestType").value = "main";
  $("randomGmn").value = "G";
  $("randomEstimated").value = "1";
  $("randomSource").value = "manual";
  $("randomPriority").value = "medium";
  $("randomGoal").value = "";
}

function openPivotModal() {
  const task = taskById(selectedTaskId);
  $("pivotNewTitle").value = task?.current_title || task?.name || "";
  $("pivotReason").value = "";
  $("pivotDiscovery").value = "";
  setPivotType("renamed");
  $("pivotModal").classList.remove("hide");
  $("pivotNewTitle").focus();
}

function setPivotType(type) {
  selectedPivotType = type;
  document.querySelectorAll(".pivot-option").forEach(btn => btn.classList.toggle("active", btn.dataset.pivotType === type));
}

function applyPivot() {
  const originalTask = taskById(selectedTaskId);
  const newTitle = $("pivotNewTitle").value.trim();
  const reason = $("pivotReason").value.trim();
  const discovery = $("pivotDiscovery").value.trim();
  if (!originalTask || !newTitle || !reason) {
    alert("请填写转向类型、新任务标题和转向原因。");
    return;
  }
  const originalTaskId = originalTask.id;
  const originalTitle = originalTask.original_title || originalTask.name;
  let actualTaskId = originalTask.id;
  let actualTask = originalTask;
  if (selectedPivotType === "renamed") {
    Object.assign(originalTask, {
      name: newTitle,
      current_title: newTitle,
      original_title: originalTitle,
      pivot_status: "renamed",
      pivot_reason: reason,
      discovery_note: discovery
    });
  } else {
    actualTask = {
      ...originalTask,
      id: newId("T-PVT"),
      name: newTitle,
      current_title: newTitle,
      original_title: newTitle,
      status: "Not Started",
      pivot_status: "none",
      pivot_reason: "",
      discovery_note: "",
      generated_task_id: "",
      is_random_event: false
    };
    data.tasks.unshift(actualTask);
    actualTaskId = actualTask.id;
    Object.assign(originalTask, {
      pivot_status: selectedPivotType,
      original_title: originalTitle,
      current_title: originalTask.current_title || originalTask.name,
      pivot_reason: reason,
      discovery_note: discovery,
      generated_task_id: actualTaskId,
      status: selectedPivotType === "paused_for_new_task" ? "Paused" : "Discovery"
    });
  }
  const log = {
    ...readForm(),
    id: newId("L-PVT"),
    whatDone: discovery || `从「${originalTitle}」发现「${newTitle}」`,
    problem: reason,
    nextStep: selectedPivotType === "renamed" ? "按新任务名称继续推进" : `开始处理：${newTitle}`,
    is_random_event: Boolean(originalTask.is_random_event),
    is_pivoted: true,
    original_task_id: originalTaskId,
    actual_task_id: actualTaskId,
    pivot_note: `${pivotLabel(selectedPivotType)}：${reason}`,
    taskId: actualTaskId,
    questId: actualTask.questId,
    gmn: actualTask.gmn,
    skillXp: buildSkillXp(actualTask)
  };
  data.logs.unshift(log);
  const completedTask = taskById(log.actual_task_id || log.taskId);
  if (completedTask) completedTask.status = "Done";
  applySkillXp(log.skillXp);
  selectedTaskId = actualTaskId;
  selectedQuestId = actualTask.questId;
  syncGoalForQuest(selectedQuestId);
  closeModal("pivotModal");
  save();
  clearForm();
  resetTimer();
  renderAll();
  renderSessionResult(log);
  showScreen("focus");
}

function pivotLabel(type) {
  if (type === "renamed") return "改名继续";
  if (type === "paused_for_new_task") return "暂停旧任务，创建新任务";
  return "旧任务算发现问题，创建新任务";
}

// src/ui/render-dashboard.js
// Extracted from index.html during the safe modular refactor.

function renderGoals() {
  $("goalList").innerHTML = data.goals2030.map(g => `
    <div class="goal-row">
      <div class="goal-head"><span>${escapeHtml(g.id)}</span><span>${goalProgress(g)}%</span></div>
      <div class="bar"><div class="fill" style="--value:${goalProgress(g)}%"></div></div>
    </div>
  `).join("");
}

function renderSkillMini() {
  $("skillMini").innerHTML = data.skills.slice(0, 4).map(s => `
    <div class="skill-mini">
      <div class="goal-head"><span>${escapeHtml(s.name.split(" / ")[0])}</span><span>Lv.${s.level}</span></div>
      <div class="bar"><div class="fill" style="--value:${Math.min(100, s.xp / s.maxXp * 100)}%"></div></div>
    </div>
  `).join("");
}

function renderMap() {
  syncTimerWithClock();
  renderWeeklyCommandPanel();
  renderLifeGrid();
  renderCampaignGrid();
  renderWeeklyMap();
  renderTaskRail();
  renderMapCollapseState();
  renderActiveTimerPanel();
  const avg = overallAnnualProgress();
  $("annualProgress").textContent = pct(avg);
  $("annualFill").style.setProperty("--value", pct(avg));
  $("weekSessions").textContent = data.logs.length;
  $("weekLogs").textContent = data.logs.length;
}

function logBelongsToQuest(log, questId) {
  const task = taskById(log.actual_task_id || log.taskId);
  return log.questId === questId || task?.questId === questId;
}

function logDateKey(log) {
  const parsed = parseLogDate(log.date);
  return parsed ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}` : String(log.date || "").slice(0, 10);
}

function weeklyFocusDoneToday(focus) {
  return data.logs.some(log => {
    const logTaskId = log.actual_task_id || log.taskId;
    return logDateKey(log) === todayISO() && (logTaskId === focus.taskId || logBelongsToQuest(log, focus.questId));
  });
}

function weeklyFocusDoneThisWeek(focus) {
  return logsForWeek(0).filter(log => {
    const logTaskId = log.actual_task_id || log.taskId;
    return logTaskId === focus.taskId || logBelongsToQuest(log, focus.questId);
  }).length;
}

function renderWeeklyCommandPanel() {
  const doneCount = weeklyCommandFocus.filter(weeklyFocusDoneToday).length;
  $("weeklyCommandPanel").innerHTML = `
    ${doneCount === weeklyCommandFocus.length ? `<div class="command-complete">今天主要任务完成了。可以去选择其他任务，或者收工复盘。</div>` : ""}
    <div class="weekly-command-grid">
      ${weeklyCommandFocus.map(focus => {
        const quest = questById(focus.questId);
        const task = taskById(focus.taskId) || tasksForQuest(focus.questId)[0];
        const doneToday = weeklyFocusDoneToday(focus);
        const weekDone = weeklyFocusDoneThisWeek(focus);
        return `
          <div class="weekly-command-card ${doneToday ? "done" : ""}">
            <span class="pill">${focus.label} · ${doneToday ? "今日已完成" : "今日未完成"}</span>
            <h4>${escapeHtml(focus.title)}</h4>
            <p>${escapeHtml(focus.note)}</p>
            <small>本周 ${weekDone} 次 · ${escapeHtml(quest?.name || focus.questId)} / ${escapeHtml(task?.current_title || task?.name || "选择任务")}</small>
            <button class="${doneToday ? "secondary" : "primary"}" data-weekly-focus-start="${focus.id}">${doneToday ? "继续加一轮" : "开始 20 分钟"}</button>
          </div>
        `;
      }).join("")}
    </div>
  `;
  document.querySelectorAll("[data-weekly-focus-start]").forEach(btn => {
    btn.onclick = () => startWeeklyFocus(btn.dataset.weeklyFocusStart);
  });
}

function startWeeklyFocus(focusId) {
  const focus = weeklyCommandFocus.find(item => item.id === focusId);
  if (!focus) return;
  const task = taskById(focus.taskId) || tasksForQuest(focus.questId)[0];
  if (!task) return;
  if (!confirmStartNewSession(task.id)) return;
  selectedTaskId = task.id;
  selectedQuestId = task.questId;
  syncGoalForQuest(selectedQuestId);
  setTimerForTask({ ...task, minutes: 20 }, true);
  showScreen("focus");
  if ($("durationInput")) $("durationInput").value = "20";
  seconds = 20 * 60;
  renderTimer();
  if (!running) toggleTimer();
}

function renderMapCollapseState() {
  const state = readMapCollapseState();
  document.querySelectorAll("[data-collapse-section]").forEach(section => {
    const key = section.dataset.collapseSection;
    section.classList.toggle("collapsed", Boolean(state[key]));
  });
}

function toggleMapSection(key) {
  const state = readMapCollapseState();
  state[key] = !state[key];
  saveMapCollapseState(state);
  renderMapCollapseState();
}

function renderActiveTimerPanel() {
  const panel = $("activeTimerPanel");
  if (!panel) return;
  const task = taskById(timerTaskId || selectedTaskId);
  const show = Boolean(task && timerSessionActive && seconds > 0);
  panel.classList.toggle("hide", !show);
  if (!show) return;
  $("activeTimerLeft").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  $("activeTimerState").textContent = running ? "计时中" : "已暂停";
  $("activeTimerTask").textContent = task.current_title || task.name;
  $("returnFocusBtn").onclick = () => {
    selectedTaskId = task.id;
    selectedQuestId = task.questId;
    syncGoalForQuest(selectedQuestId);
    showScreen("focus");
  };
  $("cancelFocusBtn").onclick = () => {
    cancelActiveSessionWithConfirm();
  };
}

function renderLifeGrid() {
  $("lifeGrid").innerHTML = data.goals2030.map(goal => `
    <button class="life-cell ${goal.id === selectedGoalId ? "active" : ""}" data-goal="${goal.id}">
      <span class="node-title">${escapeHtml(goalLabel(goal))}</span>
      <span class="node-compact"><span class="type-badge">${escapeHtml(roleBadge(goal.role))}</span><span>${goalProgress(goal)}%</span></span>
      <div class="bar"><div class="fill" style="--value:${goalProgress(goal)}%"></div></div>
    </button>
  `).join("");
  document.querySelectorAll("[data-goal]").forEach(btn => btn.onclick = () => {
    selectedGoalId = btn.dataset.goal;
    const campaign = campaignQuestsForGoal(selectedGoalId)[0];
    if (campaign) {
      selectCampaignEntry(campaign.id);
    }
    renderAll();
  });
}

function selectCampaignEntry(campaignId) {
  selectedCampaignId = campaignId;
  syncGoalForQuest(selectedCampaignId);
  const chapter = chapterQuestsForCampaign(campaignId)[0];
  selectedQuestId = chapter?.id || campaignId;
  const task = tasksForQuest(selectedQuestId)[0];
  if (task) selectedTaskId = task.id;
}

function renderCampaignGrid() {
  const campaigns = campaignQuestsForGoal(selectedGoalId);
  $("campaignGrid").innerHTML = campaigns.map(q => {
    const children = chapterQuestsForCampaign(q.id);
    const progress = computedQuestProgress(q);
    const type = questTypeForQuest(q);
    return `
      <button class="campaign-card ${typeClass(type)} ${q.id === selectedCampaignId ? "active" : ""} ${progress >= 100 ? "state-done" : "state-todo"}" data-campaign="${q.id}">
        <span class="node-title">${escapeHtml(q.name)}</span>
        <span class="node-compact"><span class="type-badge">年度目标</span><span>${Math.round(progress)}%</span></span>
        <div class="bar"><div class="fill" style="--value:${progress}%"></div></div>
        <small>${escapeHtml(q.target)}</small>
      </button>
    `;
  }).join("") || `<p>这个 2030 分类下还没有 2026 战役。</p>`;
  document.querySelectorAll("[data-campaign]").forEach(btn => btn.onclick = () => {
    selectCampaignEntry(btn.dataset.campaign);
    renderAll();
  });
}

function renderWeeklyMap() {
  if (isMetricOnlyQuest(selectedCampaignId)) {
    const q = questById(selectedCampaignId);
    $("weeklyMap").innerHTML = q ? `
      <div class="metric-only-card">
        <span class="pill">数据记录目标</span>
        <h4>${escapeHtml(q.name)}</h4>
        <p>${escapeHtml(q.description || q.target)}</p>
        <b>${Number(q.currentValue || 0)} / ${Number(q.targetValue || 0)} ${escapeHtml(q.unit || "")}</b>
      </div>
    ` : "";
    return;
  }
  const visibleQuests = chapterQuestsForCampaign(selectedCampaignId);
  const fallbackQuest = questById(selectedCampaignId);
  const nodes = visibleQuests.length ? visibleQuests : (fallbackQuest ? [fallbackQuest] : []);
  $("weeklyMap").innerHTML = nodes.map(q => questNodeHtml(q)).join("") || `<p>选择其他 2030 分类查看本周关卡。</p>`;
  document.querySelectorAll("[data-quest-node]").forEach(btn => btn.onclick = () => {
    selectedQuestId = btn.dataset.questNode;
    syncGoalForQuest(selectedQuestId);
    const task = tasksForQuest(selectedQuestId)[0];
    if (task) selectedTaskId = task.id;
    renderAll();
  });
}

function questNodeHtml(q) {
  const progress = computedQuestProgress(q);
  const type = questTypeForQuest(q);
  const estimated = tasksForQuest(q.id).reduce((s, t) => s + Number(t.estimated_sessions || 1), 0);
  const progressDetail = valueProgress(q) !== null
    ? `${Number(q.currentValue || 0)} / ${Number(q.targetValue || 0)} ${escapeHtml(q.unit || "")}`
    : `${estimated || 1} 次`;
  const discovery = tasksForQuest(q.id).some(t => t.status === "Discovery" || t.pivot_status === "completed_as_discovery");
  const pivotLinks = tasksForQuest(q.id).filter(t => t.generated_task_id).map(t => {
    const generated = taskById(t.generated_task_id);
    return `<div class="pivot-link">${escapeHtml(t.current_title || t.name)} ⇢ ${escapeHtml(generated?.current_title || generated?.name || "新任务")}</div>`;
  }).join("");
  return `
    <button class="quest-map-node ${typeClass(type)} ${gmnClass(q.gmn)} ${q.id === selectedQuestId ? "active" : ""} ${discovery ? "discovery" : ""} ${progress >= 100 ? "state-done" : "state-todo"}" data-quest-node="${q.id}">
      <span class="node-title">${escapeHtml(`${q.mapDepth ? "- " : ""}${q.name}`)}</span>
      <span class="node-compact"><span class="type-badge">${typeBadge(discovery ? "pivot" : type)}</span><span class="gmn-tag ${gmnClass(q.gmn)}">${q.gmn}</span></span>
      <small>${progress}% · ${progressDetail}</small>
      ${pivotLinks}
    </button>
  `;
}

function renderTaskRail() {
  if (isMetricOnlyQuest(selectedQuestId) || isMetricOnlyQuest(selectedCampaignId)) {
    $("taskRail").innerHTML = `
      <div class="metric-only-card compact">
        <span class="pill">无需 20 分钟</span>
        <h4>只记录结果数据</h4>
        <p>点击右侧「记录体重」，输入本周体重即可。</p>
      </div>
    `;
    return;
  }
  const tasks = tasksForQuest(selectedQuestId);
  $("taskRail").innerHTML = tasks.map(t => taskMapHtml(t)).join("") || `<p>这个关卡还没有 20min task。</p>`;
  document.querySelectorAll("[data-task-node]").forEach(btn => btn.onclick = () => {
    selectedTaskId = btn.dataset.taskNode;
    selectedQuestId = taskById(selectedTaskId).questId;
    syncGoalForQuest(selectedQuestId);
    renderAll();
  });
}

function taskMapHtml(t) {
  const type = questTypeForTask(t);
  const quest = questById(t.questId);
  const questValueProgress = quest ? valueProgress(quest) : null;
  const progress = questValueProgress !== null
    ? computedQuestProgress(quest)
    : (data.logs.some(l => (l.actual_task_id || l.taskId) === t.id) ? 100 : 0);
  const progressText = questValueProgress !== null
    ? `已完成 ${Number(quest.currentValue || 0)} / ${Number(quest.targetValue || 0)} ${escapeHtml(quest.unit || "")}`
    : `${progress >= 100 ? "已完成" : "未完成"} · ${t.estimated_sessions || 1} 次`;
  const generated = t.generated_task_id ? taskById(t.generated_task_id) : null;
  return `
    <button class="task-map-card ${typeClass(type)} ${gmnClass(t.gmn)} ${t.id === selectedTaskId ? "active" : ""} ${progress >= 100 ? "state-done" : "state-todo"}" data-task-node="${t.id}">
      <span class="node-title">${escapeHtml(t.current_title || t.name)}</span>
      <span class="node-compact"><span class="type-badge">${t.status === "Discovery" ? "Discovery" : typeBadge(type)}</span><span class="gmn-tag ${gmnClass(t.gmn)}">${t.gmn}</span></span>
      <small>${progressText}</small>
      ${generated ? `<div class="pivot-link">⇢ ${escapeHtml(generated.current_title || generated.name)}</div>` : ""}
    </button>
  `;
}

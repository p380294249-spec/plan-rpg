// src/ui/render-focus.js
// Extracted from index.html during the safe modular refactor.

function renderFocus() {
  populateMetricGoalSelect();
  if (!$("metricLogDate").value) $("metricLogDate").value = todayISO();
  const recordType = timerSessionActive && timerTaskId ? "session" : ($("recordTypeSelect")?.value || "session");
  setRecordType(recordType);
  const sessionTasks = data.tasks.filter(t => !isMetricOnlyTask(t));
  $("taskSelect").innerHTML = sessionTasks.map(t => {
    const q = questById(t.questId);
    return `<option value="${t.id}" ${t.id === selectedTaskId ? "selected" : ""}>${escapeHtml(q.name)} · ${escapeHtml(t.current_title || t.name)} · ${gmnText(t.gmn)}</option>`;
  }).join("");
  const selected = taskById(selectedTaskId);
  const t = selected && !isMetricOnlyTask(selected) ? selected : sessionTasks[0];
  if (!t) {
    setRecordType("metric");
    return;
  }
  selectedTaskId = t.id;
  const q = questById(t.questId);
  selectedQuestId = q.id;
  setTimerForTask(t);
  $("sessionGmn").value = t.gmn || "G";
  $("sessionGmn").onchange = (e) => updateTaskGmn(t.id, e.target.value);
  $("focusTaskName").textContent = t.current_title || t.name;
  renderFocusContext(q, t);
  renderFocusChoiceBoard(t);
  renderWorthRecordToggle();
  $("sessionTypePill").textContent = `${selectedDurationMinutes()}min Session`;
  $("durationInput").onchange = () => {
    const minutes = selectedDurationMinutes();
    $("durationInput").value = String(minutes);
    $("sessionTypePill").textContent = `${minutes}min Session`;
    if (!isMeditationTask(t)) $("whatDone").placeholder = `这 ${minutes} 分钟具体推进了什么？`;
    if (!running) {
      seconds = minutes * 60;
      renderTimer();
    }
  };
  renderRecordBoardMode(t);
  renderSkillRewardPreview(t);
  $("taskSelect").onchange = (e) => {
    const nextTaskId = e.target.value;
    selectedTaskId = nextTaskId;
    selectedQuestId = taskById(selectedTaskId).questId;
    syncGoalForQuest(selectedQuestId);
    renderAll();
  };
  renderTimer();
  setRecordType(timerSessionActive && timerTaskId ? "session" : ($("recordTypeSelect")?.value || "session"));
}

function setRecordType(type) {
  const isMetric = type === "metric";
  $("focus")?.classList.toggle("record-mode-metric", isMetric);
  $("focus")?.classList.toggle("record-mode-session", !isMetric);
  if ($("recordTypeSelect")) $("recordTypeSelect").value = isMetric ? "metric" : "session";
  $("recordTypeLabel")?.classList.toggle("hide", !isMetric);
  $("sessionRecordFields")?.classList.toggle("hide", isMetric);
  $("sessionLogPanel")?.classList.toggle("hide", isMetric);
  if (isMetric) $("sessionResult")?.classList.add("hide");
  $("metricRecordFields")?.classList.toggle("hide", !isMetric);
  if ($("sessionTypePill")) $("sessionTypePill").textContent = isMetric ? "Quick Metric Log" : `${selectedDurationMinutes()}min Session`;
}

function populateMetricGoalSelect() {
  if (!$("metricLogGoal")) return;
  const current = $("metricLogGoal").value || selectedGoalId;
  $("metricLogGoal").innerHTML = data.goals2030.map(goal => `<option value="${goal.id}">${escapeHtml(goalLabel(goal))}</option>`).join("");
  $("metricLogGoal").value = data.goals2030.some(goal => goal.id === current) ? current : selectedGoalId;
}

function renderFocusContext(quest, task) {
  if (!$("focusContext")) return;
  const root = questById(rootQuestId(quest.id));
  const goal = data.goals2030.find(item => item.id === questGoalIds(root || quest)[0] || item.id === selectedGoalId);
  const parts = [
    goalLabel(goal) || selectedGoalId,
    root?.name,
    quest.id !== root?.id ? quest.name : "",
    task?.gmn ? gmnText(task.gmn) : ""
  ].filter(Boolean);
  $("focusContext").innerHTML = parts.map(part => `<span>${escapeHtml(part)}</span>`).join("");
}

function focusSessionTasks() {
  return data.tasks.filter(task => !isMetricOnlyTask(task));
}

function focusQuestOptions(campaignId = selectedCampaignId) {
  const children = chapterQuestsForCampaign(campaignId).filter(quest => tasksForQuest(quest.id).some(task => !isMetricOnlyTask(task)));
  const campaign = questById(campaignId);
  return children.length ? children : (campaign && tasksForQuest(campaign.id).some(task => !isMetricOnlyTask(task)) ? [campaign] : []);
}

function firstSessionTaskForQuest(questId) {
  return tasksForQuest(questId).find(task => !isMetricOnlyTask(task)) || null;
}

function firstSessionTaskForCampaign(campaignId) {
  return focusQuestOptions(campaignId).map(quest => firstSessionTaskForQuest(quest.id)).find(Boolean) || null;
}

function renderFocusChoiceBoard(task) {
  if (!$("focusChoiceBoard")) return;
  const campaignOptions = campaignQuestsForGoal(selectedGoalId).filter(campaign => firstSessionTaskForCampaign(campaign.id));
  const questOptions = focusQuestOptions(selectedCampaignId);
  $("focusChoiceBoard").innerHTML = `
    <div class="focus-choice-group">
      <span>目标</span>
      <div class="focus-choice-row">
        ${campaignOptions.map(campaign => focusChoiceButton("campaign", campaign.id, campaign.name, campaign.id === selectedCampaignId)).join("")}
      </div>
    </div>
    <div class="focus-choice-group">
      <span>模块</span>
      <div class="focus-choice-row">
        ${questOptions.map(quest => focusChoiceButton("quest", quest.id, quest.name, quest.id === selectedQuestId)).join("")}
      </div>
    </div>
  `;
  document.querySelectorAll("[data-focus-campaign]").forEach(btn => {
    btn.onclick = () => selectFocusCampaign(btn.dataset.focusCampaign);
  });
  document.querySelectorAll("[data-focus-quest]").forEach(btn => {
    btn.onclick = () => selectFocusQuest(btn.dataset.focusQuest);
  });
}

function focusChoiceButton(type, id, label, active) {
  const attr = type === "campaign" ? "data-focus-campaign" : "data-focus-quest";
  return `<button class="focus-choice ${active ? "active" : ""}" type="button" ${attr}="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
}

function selectFocusCampaign(campaignId) {
  const nextTask = firstSessionTaskForCampaign(campaignId);
  selectedCampaignId = campaignId;
  selectedQuestId = nextTask?.questId || campaignId;
  selectedTaskId = nextTask?.id || selectedTaskId;
  syncGoalForQuest(selectedQuestId);
  renderAll();
}

function selectFocusQuest(questId) {
  const nextTask = firstSessionTaskForQuest(questId);
  selectedQuestId = questId;
  selectedTaskId = nextTask?.id || selectedTaskId;
  syncGoalForQuest(selectedQuestId);
  renderAll();
}

function renderWorthRecordToggle() {
  const button = $("worthRecordBtn");
  if (!button) return;
  button.classList.toggle("active", Boolean(currentSessionWorthRecording));
  button.setAttribute("aria-pressed", currentSessionWorthRecording ? "true" : "false");
  button.textContent = currentSessionWorthRecording ? "★ 值得记录" : "☆ 值得记录";
  button.onclick = () => {
    currentSessionWorthRecording = !currentSessionWorthRecording;
    renderWorthRecordToggle();
    const task = taskById(selectedTaskId);
    if (task) renderSkillRewardPreview(task);
  };
}

function renderSkillRewardPreview(task) {
  const skillRewards = buildSkillXp(task).filter(item => Number(item.xp || 0) > 0);
  $("skillRewardPreview").innerHTML = `
    <div class="reward-strip">
      ${skillRewards.map(item => {
        const skill = skillById(item.skillId);
        return `<div class="reward-pill"><span>${escapeHtml((skill?.name || item.skillId).split(" / ")[0])}</span><b>+${item.xp}</b></div>`;
      }).join("") || `<div class="reward-pill muted"><span>专注记录</span><b>+0</b></div>`}
      <div class="reward-pill gmn-reward"><span>GMN</span><b>${escapeHtml(task.gmn || "G")}</b></div>
      ${currentSessionWorthRecording ? `<div class="reward-pill worth-reward"><span>值得记录</span><b>★</b></div>` : ""}
    </div>
  `;
}

function renderRecordBoardMode(task) {
  const meditation = isMeditationTask(task);
  $("focus")?.classList.toggle("meditation-session", meditation);
  $("focus")?.classList.toggle("simple-session", !meditation);
  $("recordBoardTitle").textContent = meditation ? "冥想记录" : "行动记录";
  $("whatDoneLabel").firstChild.textContent = meditation ? "场景" : "做了什么";
  $("problemLabel").firstChild.textContent = meditation ? "感受 / Mood" : "补充";
  $("whatDone").placeholder = meditation ? "在哪里、什么姿势、冥想前的状态..." : "这 20 分钟实际做了什么？一句话也可以。";
  $("problem").placeholder = meditation ? "身体、呼吸、情绪、念头有没有变化？" : "可不填：卡点、下一步、结果...";
  ["solutionLabel", "goodLabel", "badLabel", "nextStepLabel", "moodStressLabel"].forEach(id => $(id).classList.add("hide"));
  $("problemLabel").classList.toggle("hide", !meditation);
}

function renderTimer() {
  $("timerValue").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const ended = timerSessionActive && !running && seconds <= 0;
  $("startPauseBtn").textContent = running ? "暂停" : (ended ? "继续计时" : "开始");
  $("saveSessionBtn").textContent = ended ? "填写完成并结算" : "完成并结算";
  renderActiveTimerPanel();
}

function clearForm() {
  ["whatDone", "problem", "solution", "good", "bad", "nextStep", "moodStress"].forEach(id => $(id).value = "");
}

function renderSessionResult(log) {
  const q = questById(log.questId);
  const t = taskById(log.taskId);
  const meditation = isMeditationTask(t);
  const missions = typeof focusMissionStatus === "function" ? focusMissionStatus() : null;
  const claimableMissions = missions ? [missions.daily, missions.weekly].filter(mission => mission.canClaim) : [];
  $("sessionResult").classList.remove("hide");
  $("sessionResult").innerHTML = `
    <span class="pill">Session 结算完成</span>
    <h3>${escapeHtml(t.current_title || t.name)}</h3>
    <div class="reward-line">
      <div class="reward"><span>专注时长</span><b>+${log.minutes} min</b></div>
      <div class="reward"><span>GMN</span><b>${log.gmn}</b></div>
      <div class="reward"><span>Quest</span><b>${computedQuestProgress(q)}%</b></div>
      ${log.is_random_event ? `<div class="reward"><span>突发任务</span><b>${typeBadge(t.quest_type || "side")}</b></div>` : ""}
      ${log.is_pivoted ? `<div class="reward"><span>任务转向</span><b>Discovery</b></div>` : ""}
    </div>
    ${claimableMissions.length ? `
      <div class="mission-complete-banner">
        <b>${claimableMissions.some(mission => mission.type === "daily") ? "今日挑战完成" : "本周挑战完成"}</b>
        <span>${claimableMissions.map(mission => `${mission.label} ${roundedFocusUnits(mission.units)} / ${mission.target}`).join(" · ")}</span>
        <div class="actions">
          ${claimableMissions.map(mission => `<button class="primary" data-game-claim="${mission.type}">领取宝箱</button>`).join("")}
        </div>
      </div>
    ` : ""}
    <p><b>${meditation ? "场景" : "做了什么"}：</b>${escapeHtml(log.whatDone)}</p>
    ${meditation ? `<p><b>感受：</b>${escapeHtml(log.problem || "未填写")}</p>` : ""}
    ${log.is_pivoted ? `<p><b>转向说明：</b>${escapeHtml(log.pivot_note || "已记录转向")}</p>` : ""}
    ${log.is_random_event ? `
      <div class="route-item">
        <b>这个突发事件要怎么归档？</b>
        <div class="actions">
          <button class="secondary" data-result-classify="main">转为正式主线</button>
          <button class="secondary" data-result-classify="side">转为支线</button>
          <button class="secondary" data-result-classify="maintenance">只是维护</button>
          <button class="secondary" data-result-classify="noise">归类噪音</button>
        </div>
      </div>
    ` : ""}
    <div class="actions">
      <button class="secondary" id="editLastBtn">修改记录</button>
      <button class="secondary" id="continueBtn">继续 ${log.minutes} 分钟</button>
      <button class="primary" id="resultMapBtn">返回地图</button>
      <button class="secondary" id="resultReviewBtn">查看复盘</button>
    </div>
  `;
  $("editLastBtn").onclick = () => editLog(log.id);
  $("continueBtn").onclick = () => showScreen("focus");
  $("resultMapBtn").onclick = () => showScreen("map");
  $("resultReviewBtn").onclick = () => showScreen("review");
  document.querySelectorAll("[data-result-classify]").forEach(btn => btn.onclick = () => classifyRandomEvent(log.actual_task_id || log.taskId, btn.dataset.resultClassify));
  if (typeof bindGameButtons === "function") bindGameButtons();
}

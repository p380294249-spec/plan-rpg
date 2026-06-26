// src/ui/render-focus.js
// Extracted from index.html during the safe modular refactor.

function renderFocus() {
  populateMetricGoalSelect();
  if (!$("metricLogDate").value) $("metricLogDate").value = todayISO();
  setRecordType($("recordTypeSelect")?.value || "session");
  if (timerSessionActive && timerTaskId) {
    const activeTask = taskById(timerTaskId);
    if (activeTask) {
      selectedTaskId = activeTask.id;
      selectedQuestId = activeTask.questId;
      syncGoalForQuest(selectedQuestId);
    }
  }
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
  $("skillRewardPreview").innerHTML = `
    <div class="reward-line">
      ${buildSkillXp(t).map(x => `<div class="reward"><span>${escapeHtml(skillById(x.skillId).name.split(" / ")[0])}</span><b>+${x.xp} XP</b></div>`).join("")}
      <div class="reward"><span>GMN</span><b>${t.gmn}</b></div>
      ${t.is_random_event ? `<div class="reward"><span>突发</span><b>${typeBadge(t.quest_type)}</b></div>` : ""}
    </div>
  `;
  $("taskSelect").onchange = (e) => {
    const nextTaskId = e.target.value;
    if (!confirmStartNewSession(nextTaskId)) {
      $("taskSelect").value = selectedTaskId;
      return;
    }
    selectedTaskId = nextTaskId;
    selectedQuestId = taskById(selectedTaskId).questId;
    syncGoalForQuest(selectedQuestId);
    renderAll();
  };
  renderTimer();
  setRecordType($("recordTypeSelect")?.value || "session");
}

function setRecordType(type) {
  const isMetric = type === "metric";
  if ($("recordTypeSelect")) $("recordTypeSelect").value = isMetric ? "metric" : "session";
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

function renderRecordBoardMode(task) {
  const meditation = isMeditationTask(task);
  $("recordBoardTitle").textContent = meditation ? "冥想记录板" : "战斗记录板";
  $("whatDoneLabel").firstChild.textContent = meditation ? "场景" : "做了什么";
  $("problemLabel").firstChild.textContent = meditation ? "感受 / Mood" : "遇到什么问题";
  $("whatDone").placeholder = meditation ? "在哪里、什么姿势、周围环境、冥想前的状态..." : `这 ${selectedDurationMinutes()} 分钟具体推进了什么？`;
  $("problem").placeholder = meditation ? "身体、呼吸、情绪、念头有没有变化？" : "卡点、阻力、情绪、信息缺口...";
  ["solutionLabel", "goodLabel", "badLabel", "nextStepLabel"].forEach(id => $(id).classList.toggle("hide", meditation));
  $("moodStressLabel").classList.toggle("hide", meditation);
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
    <p><b>${meditation ? "场景" : "做了什么"}：</b>${escapeHtml(log.whatDone)}</p>
    <p><b>${meditation ? "感受" : "问题"}：</b>${escapeHtml(log.problem || "未填写")}</p>
    ${meditation ? "" : `<p><b>下一步：</b>${escapeHtml(log.nextStep || "未填写")}</p>`}
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
}

// src/ui/render-detail.js
// Extracted from index.html during the safe modular refactor.

function renderDetail() {
  const q = questById(selectedQuestId);
  const tasks = tasksForQuest(q.id);
  const currentTask = taskById(selectedTaskId);
  const selectedTask = currentTask?.questId === q.id ? currentTask : tasks[0];
  const taskLogs = selectedTask ? data.logs.filter(l => [selectedTask.id, selectedTask.generated_task_id].includes(l.taskId) || [selectedTask.id, selectedTask.generated_task_id].includes(l.actual_task_id)) : [];
  const taskType = questTypeForTask(selectedTask);
  const quickMetric = quickMetricConfigForQuest(q.id);
  const metricOnly = isMetricOnlyQuest(q);
  const metricCapable = Boolean(quickMetric);
  const metricLogs = metricCapable ? data.metricLogs.filter(log => metricQuestIdFor(log.goalId, log.metricType) === q.id).slice(0, 5) : [];
  const detailTypeLabel = selectedTask ? typeBadge(taskType) : typeBadge(questTypeForQuest(q));
  $("questDetail").innerHTML = `
    <div class="simple-detail">
      <span class="pill">${detailTypeLabel} · ${gmnText(selectedTask?.gmn || q.gmn)}</span>
      <h3>${escapeHtml(q.name)}</h3>
      ${quickMetric ? `<button class="primary full" id="detailQuickMetric">${escapeHtml(quickMetric.label)}</button>` : ""}
      ${metricCapable || metricOnly ? `
        <div class="metric-only-summary">
          <b>${Number(q.currentValue || 0)} / ${Number(q.targetValue || 0)} ${escapeHtml(q.unit || "")}</b>
          <small>${escapeHtml(q.target || "")}</small>
        </div>
      ` : ""}
      ${selectedTask && !metricOnly ? `<button class="secondary full" id="detailStart">开始20分钟记录</button>` : ""}
      <details class="custom-task-box">
        <summary class="secondary full">修改 GMN</summary>
        <div class="form-grid">
          <label>章节属于
            <select id="detailQuestGmn">
              <option value="G" ${q.gmn === "G" ? "selected" : ""}>G 成长</option>
              <option value="M" ${q.gmn === "M" ? "selected" : ""}>M 维护</option>
              <option value="N" ${q.gmn === "N" ? "selected" : ""}>N 噪音</option>
            </select>
          </label>
          ${selectedTask ? `
          <label>当前任务属于
            <select id="detailTaskGmn">
              <option value="G" ${selectedTask.gmn === "G" ? "selected" : ""}>G 成长</option>
              <option value="M" ${selectedTask.gmn === "M" ? "selected" : ""}>M 维护</option>
              <option value="N" ${selectedTask.gmn === "N" ? "selected" : ""}>N 噪音</option>
            </select>
          </label>
          ` : ""}
        </div>
        <div class="actions">
          <button class="secondary" id="saveQuestGmnBtn">保存章节判断</button>
          ${selectedTask ? `<button class="secondary" id="saveTaskGmnBtn">保存任务判断</button>` : ""}
        </div>
      </details>
      <details class="custom-task-box" ${metricOnly ? "open" : ""}>
        <summary class="secondary full">更多记录设置</summary>
        ${valueProgress(q) !== null ? `
        <div class="custom-task-box">
          <h4>更新目标进度</h4>
          <div class="form-grid">
            <label>当前值<input id="metricCurrent" type="number" step="0.01" value="${Number(q.currentValue || 0)}" /></label>
            <label>目标值<input id="metricTarget" type="number" step="0.01" value="${Number(q.targetValue || 0)}" /></label>
          </div>
          <small>单位：${escapeHtml(q.unit || "")}。</small>
          <button class="secondary full" id="saveMetricBtn">保存进度</button>
        </div>
        ` : ""}
        ${metricOnly ? "" : `<div class="custom-task-box">
          <h4>自己写一个任务</h4>
          <label>任务标题<input id="quickTaskTitle" placeholder="例如：更新 DFK 系统" /></label>
          <label>记录重点<textarea id="quickTaskNote" placeholder="这次 20 分钟主要做什么？"></textarea></label>
          <div class="form-grid">
            <label>时间<input id="quickTaskMinutes" type="number" min="1" max="180" value="20" /></label>
            <label>类型<select id="quickTaskGmn"><option value="G">G 成长</option><option value="M">M 维护</option><option value="N">N 噪音</option></select></label>
          </div>
          <button class="secondary full" id="quickTaskStart">加入并开始记录</button>
        </div>`}
        <h4>最近记录</h4>
        <div class="route">
          ${metricCapable
            ? (metricLogs.length ? metricLogs.map(log => `<div class="route-item"><b>${escapeHtml(log.date)} · ${Number(log.value || 0)} ${escapeHtml(log.unit || "")}</b><br><small>${escapeHtml(log.note || "已记录")}</small></div>`).join("") : `<div class="route-item"><small>${metricOnly ? "还没有体重记录。2026-06-11 前已按 24 周达标计入。" : "还没有数据记录。"}</small></div>`)
            : (taskLogs.length ? taskLogs.slice(0, 3).map(log => `<div class="route-item"><b>${escapeHtml(log.date)} · ${log.minutes} 分钟 · ${gmnText(log.gmn)}</b><br><small>${escapeHtml(log.whatDone || "已记录")}</small></div>`).join("") : `<div class="route-item"><small>还没有记录。</small></div>`)}
        </div>
        ${selectedTask?.is_random_event ? `<div class="route-item"><b>突发任务归类</b><div class="actions"><button class="secondary" data-classify-random="main">主线</button><button class="secondary" data-classify-random="side">支线</button><button class="secondary" data-classify-random="maintenance">维护</button><button class="secondary" data-classify-random="noise">噪音</button></div></div>` : ""}
      </details>
    </div>
  `;
  document.querySelectorAll(".task-card").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedTaskId = btn.dataset.task;
      selectedQuestId = taskById(selectedTaskId).questId;
      syncGoalForQuest(selectedQuestId);
      renderAll();
    });
  });
  if ($("saveMetricBtn")) $("saveMetricBtn").onclick = () => updateQuestMetric(q.id);
  if ($("saveQuestGmnBtn")) $("saveQuestGmnBtn").onclick = () => updateQuestGmn(q.id, $("detailQuestGmn").value);
  if ($("saveTaskGmnBtn")) $("saveTaskGmnBtn").onclick = () => updateTaskGmn(selectedTask.id, $("detailTaskGmn").value);
  if ($("detailQuickMetric")) $("detailQuickMetric").onclick = () => startQuickMetricFromQuest(q.id);
  if ($("detailStart")) $("detailStart").addEventListener("click", startDefaultRecordFromDetail);
  if ($("quickTaskStart")) $("quickTaskStart").addEventListener("click", createQuickTask);
  document.querySelectorAll("[data-classify-random]").forEach(btn => btn.onclick = () => classifyRandomEvent(selectedTask.id, btn.dataset.classifyRandom));
}

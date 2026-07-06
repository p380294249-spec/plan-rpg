// src/ui/render-review.js
// Extracted from index.html during the safe modular refactor.

function renderReview() {
  const logs = data.logs;
  const thisWeek = logsForWeek(reviewWeeksAgo);
  const lastWeek = logsForWeek(reviewWeeksAgo + 1);
  const currentWeek = logsForWeek(0);
  const total = thisWeek.length;
  const g = thisWeek.filter(l => l.gmn === "G").length;
  const m = thisWeek.filter(l => l.gmn === "M").length;
  const n = thisWeek.filter(l => l.gmn === "N").length;
  const thisWeekMinutes = totalMinutesOf(thisWeek);
  const lastWeekMinutes = totalMinutesOf(lastWeek);
  const randomLogs = thisWeek.filter(l => l.is_random_event || taskById(l.actual_task_id || l.taskId)?.is_random_event);
  const pivotLogs = thisWeek.filter(l => l.is_pivoted);
  const maintenanceLogs = thisWeek.filter(l => taskById(l.actual_task_id || l.taskId)?.quest_type === "maintenance" || l.gmn === "M");
  const noiseLogs = thisWeek.filter(l => taskById(l.actual_task_id || l.taskId)?.quest_type === "noise" || l.gmn === "N");
  const currentWeekG = currentWeek.filter(l => l.gmn === "G").length;
  const range = weekRange(reviewWeeksAgo);
  $("reviewWeekTitle").textContent = `${reviewWeeksAgo === 0 ? "本周复盘" : "周复盘"} · ${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
  renderReviewWeekPicker();
  $("metricTotal").textContent = total;
  $("metricG").textContent = g;
  $("metricM").textContent = m;
  $("metricN").textContent = n;
  $("reviewThisWeekMinutes").textContent = `${thisWeekMinutes} min`;
  $("reviewVsLastWeek").textContent = formatMinuteDelta(thisWeekMinutes - lastWeekMinutes);
  $("reviewDirectionBadge").textContent = directionLabelForWeek(thisWeek, thisWeekMinutes);
  $("totalMinutes").textContent = `${logs.reduce((s, l) => s + Number(l.minutes || 0), 0)} min`;
  $("gRatio").textContent = currentWeek.length ? pct(currentWeekG / currentWeek.length * 100) : "0%";
  renderWeeklyFocusAreas(thisWeek, lastWeek);
  renderWeeklyMergedNotes(thisWeek);
  renderDynamicReview(randomLogs, pivotLogs, maintenanceLogs, noiseLogs);
  $("logList").innerHTML = thisWeek.map(logCard).join("") || `<p>这一周还没有日志。</p>`;
  document.querySelectorAll("[data-edit-log]").forEach(btn => btn.onclick = () => editLog(btn.dataset.editLog));
  document.querySelectorAll("[data-delete-log]").forEach(btn => btn.onclick = () => deleteLog(btn.dataset.deleteLog));
  renderNextRouteSuggestions(thisWeek);
  $("weeklyFocus").innerHTML = `
    <p style="margin:0 0 8px;color:#cbd5e1;">MINDSET：每周复盘</p>
    <div class="bar"><div class="fill" style="--value:${currentWeek.length ? Math.min(100, Math.round(totalMinutesOf(currentWeek) / 4)) : 0}%"></div></div>
  `;
}

function renderReviewWeekPicker() {
  const previousButton = $("reviewPreviousWeekBtn");
  const currentButton = $("reviewCurrentWeekBtn");
  const nextButton = $("reviewNextWeekBtn");
  currentButton.className = reviewWeeksAgo === 0 ? "primary" : "secondary";
  currentButton.setAttribute("aria-pressed", reviewWeeksAgo === 0 ? "true" : "false");
  nextButton.disabled = reviewWeeksAgo === 0;
  previousButton.onclick = () => setReviewWeek(reviewWeeksAgo + 1);
  currentButton.onclick = () => setReviewWeek(0);
  nextButton.onclick = () => setReviewWeek(reviewWeeksAgo - 1);
}

function setReviewWeek(weeksAgo) {
  reviewWeeksAgo = Math.max(0, Math.min(104, Number(weeksAgo) || 0));
  renderReview();
}

function renderWeeklyFocusAreas(thisWeek, lastWeek) {
  const topAreas = collectTopAreas(thisWeek);
  const lastWeekAreas = collectTopAreas(lastWeek);
  const lastWeekMap = new Map(lastWeekAreas.map(area => [area.label, area.minutes]));
  $("reviewFocusAreas").innerHTML = topAreas.length ? topAreas.map(area => {
    const delta = area.minutes - Number(lastWeekMap.get(area.label) || 0);
    return `
      <div class="review-text-item">
        <b>${escapeHtml(area.label)}</b><br>
        ${area.minutes} min / ${area.count} 次，较上周 ${formatMinuteDelta(delta)}
        ${area.nextMove ? `<br><small>${escapeHtml(area.nextMove)}</small>` : ""}
      </div>
    `;
  }).join("") : `<div class="review-text-item">这一周还没有足够记录。</div>`;
}

function renderTextItems(items, emptyText) {
  return items.length
    ? `<div class="review-text-list">${items.map(item => `<div class="review-text-item">${escapeHtml(item)}</div>`).join("")}</div>`
    : `<div class="review-text-item">${emptyText}</div>`;
}

function renderWeeklyMergedNotes(thisWeek) {
  const problems = collectUniqueNotes(thisWeek, "problem");
  const solutions = collectUniqueNotes(thisWeek, "solution");
  const good = collectUniqueNotes(thisWeek, "good");
  const bad = collectUniqueNotes(thisWeek, "bad");
  $("reviewProblemSolve").innerHTML = `
    <div><b>遇到的问题</b>${renderTextItems(problems, "这一周没有记录明显问题。")}</div>
    <div style="margin-top:12px;"><b>采取的解决方式</b>${renderTextItems(solutions, "这一周还没有写出解决方式。")}</div>
  `;
  $("reviewGoodBad").innerHTML = `
    <div><b>做得好的地方</b>${renderTextItems(good, "这一周还没有记录明显亮点。")}</div>
    <div style="margin-top:12px;"><b>需要调整的地方</b>${renderTextItems(bad, "这一周还没有记录明显偏差。")}</div>
  `;
}

function renderNextRouteSuggestions(thisWeek) {
  const topQuestIds = [...new Set(thisWeek.map(log => log.questId).filter(Boolean))];
  const focused = topQuestIds
    .map(id => questById(id))
    .filter(Boolean)
    .filter(q => computedQuestProgress(q) < 100)
    .slice(0, 2);
  const annual = data.quests
    .filter(q => !q.parentQuestId && q.priority === "High" && computedQuestProgress(q) < 100)
    .slice(0, 2);
  const suggestions = [...new Map([...focused, ...annual].map(q => [q.id, q])).values()].slice(0, 4);
  $("nextRoute").innerHTML = suggestions.length ? suggestions.map((quest, index) => `
    <div class="route-item"><div><b>${index + 1}. ${escapeHtml(quest.name)}</b><br><small>${escapeHtml(quest.nextMove || quest.target || "继续推进本周最重要的一步。")}</small></div></div>
  `).join("") : `<div class="route-item"><div><b>1. 先补一条本周记录</b><br><small>有了本周数据，这里才会更像真正的路线建议。</small></div></div>`;
}

function renderDynamicReview(randomLogs, pivotLogs, maintenanceLogs, noiseLogs) {
  const randomMinutes = randomLogs.reduce((s, l) => s + Number(l.minutes || 0), 0);
  const randomG = randomLogs.filter(l => l.gmn === "G").length;
  const randomM = randomLogs.filter(l => l.gmn === "M").length;
  const randomN = randomLogs.filter(l => l.gmn === "N").length;
  const randomWorthPromoting = data.tasks
    .filter(t => t.is_random_event && t.gmn === "G" && ["main", "side"].includes(t.quest_type))
    .slice(0, 5);
  $("dynamicReview").innerHTML = `
    <div class="route-item">
      <b>突发任务 GMN</b>
      <p>共 ${randomLogs.length} 次，${randomMinutes} min。G ${randomG} / M ${randomM} / N ${randomN}。</p>
    </div>
    <div class="route-item">
      <b>任务转向轨迹</b>
      ${pivotLogs.length ? pivotLogs.slice(0, 5).map(l => {
        const original = taskById(l.original_task_id);
        const actual = taskById(l.actual_task_id);
        return `<p>${escapeHtml(original?.original_title || original?.name || l.original_task_id)} → ${escapeHtml(actual?.current_title || actual?.name || l.actual_task_id)}<br><small>${escapeHtml(l.pivot_note || "")}</small></p>`;
      }).join("") : `<p>这一周没有任务转向。</p>`}
    </div>
    <div class="route-item">
      <b>维护 / 噪音</b>
      <p>维护 ${maintenanceLogs.length} 次，噪音 ${noiseLogs.length} 次。</p>
      ${noiseLogs.length ? `<small>噪音事件：${noiseLogs.slice(0, 4).map(l => escapeHtml(taskById(l.taskId)?.current_title || taskById(l.taskId)?.name || l.whatDone)).join("、")}</small>` : ""}
    </div>
    <div class="route-item">
      <b>值得转正式任务</b>
      ${randomWorthPromoting.length ? randomWorthPromoting.map(t => `<p>${escapeHtml(t.current_title || t.name)} <small>${typeBadge(t.quest_type)} / ${escapeHtml(t.reason || "突发但有产出")}</small></p>`).join("") : `<p>暂时没有明显需要升级的突发任务。</p>`}
    </div>
  `;
}

function logCard(log) {
  const q = questById(log.questId);
  const t = taskById(log.taskId);
  const meditation = isMeditationTask(t);
  return `
    <div class="log-card">
      <div class="row"><span class="pill">${log.date} · ${log.minutes || 20}min · ${log.gmn}${log.is_random_event ? " · 突发" : ""}${log.is_pivoted ? " · 转向" : ""}</span><small>${escapeHtml(q?.name || log.questId)} / ${escapeHtml(t?.current_title || t?.name || log.taskId)}</small></div>
      <p><b>${meditation ? "场景" : "做了什么"}：</b>${escapeHtml(log.whatDone || "未填写")}</p>
      <p><b>${meditation ? "感受" : "问题"}：</b>${escapeHtml(log.problem || "未填写")} ${meditation ? "" : `<br><b>下一步：</b>${escapeHtml(log.nextStep || "未填写")}`}</p>
      ${log.is_pivoted ? `<p><b>转向：</b>${escapeHtml(log.pivot_note || "已记录转向")}</p>` : ""}
      <div class="log-actions">
        <button class="secondary" data-edit-log="${log.id}">查看/修改</button>
        <button class="danger" data-delete-log="${log.id}">删除</button>
      </div>
    </div>
  `;
}

function editLog(id) {
  const log = data.logs.find(l => l.id === id);
  if (!log) return;
  editingLogId = id;
  $("editPanel").classList.remove("hide");
  $("editTask").innerHTML = data.tasks.map(t => `<option value="${t.id}" ${t.id === log.taskId ? "selected" : ""}>${t.id} · ${escapeHtml(t.name)}</option>`).join("");
  $("editGmn").value = log.gmn;
  $("editWhat").value = log.whatDone || "";
  $("editProblem").value = log.problem || "";
  $("editSolution").value = log.solution || "";
  $("editGood").value = log.good || "";
  $("editBad").value = log.bad || "";
  $("editNext").value = log.nextStep || "";
  showScreen("review");
  $("editPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateLog() {
  const index = data.logs.findIndex(l => l.id === editingLogId);
  if (index < 0) return;
  const task = taskById($("editTask").value);
  data.logs[index] = {
    ...data.logs[index],
    gmn: $("editGmn").value,
    taskId: task.id,
    questId: task.questId,
    whatDone: $("editWhat").value.trim(),
    problem: $("editProblem").value.trim(),
    solution: $("editSolution").value.trim(),
    good: $("editGood").value.trim(),
    bad: $("editBad").value.trim(),
    nextStep: $("editNext").value.trim()
  };
  editingLogId = null;
  $("editPanel").classList.add("hide");
  save();
  renderAll();
}

function deleteLog(id) {
  if (!confirm("确定删除这条日志吗？")) return;
  data.logs = data.logs.filter(l => l.id !== id);
  save();
  renderAll();
}

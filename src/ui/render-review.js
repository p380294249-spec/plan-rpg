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
  const minutesDelta = thisWeekMinutes - lastWeekMinutes;
  $("reviewVsLastWeek").textContent = formatMinuteDelta(minutesDelta);
  $("reviewVsLastWeek").className = deltaIndicatorClass(minutesDelta);
  const directionLabel = directionLabelForWeek(thisWeek, thisWeekMinutes);
  $("reviewDirectionBadge").textContent = directionLabel;
  $("reviewDirectionBadge").className = directionIndicatorClass(directionLabel);
  $("totalMinutes").textContent = `${logs.reduce((s, l) => s + Number(l.minutes || 0), 0)} min`;
  $("gRatio").textContent = currentWeek.length ? pct(currentWeekG / currentWeek.length * 100) : "0%";
  renderGmnSplitBar(thisWeek);
  renderWeeklyFocusAreas(thisWeek, lastWeek);
  renderWeeklyMergedNotes(thisWeek);
  renderDynamicReview(randomLogs, pivotLogs, maintenanceLogs, noiseLogs);
  const highlightLogs = thisWeek.filter(l => l.worthRecording);
  renderReviewHighlights(highlightLogs);
  $("logList").innerHTML = thisWeek.map(logCard).join("") || `<p>这一周还没有日志。</p>`;
  if ($("allLogsCount")) $("allLogsCount").textContent = `(${thisWeek.length})`;
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
  renderReviewWeekJump();
}

function renderReviewWeekJump() {
  const jumpSelect = $("reviewWeekJump");
  if (!jumpSelect) return;
  const weekOptions = Array.from({ length: 13 }, (_, weeksAgo) => weeksAgo);
  if (!weekOptions.includes(reviewWeeksAgo)) weekOptions.push(reviewWeeksAgo);
  jumpSelect.innerHTML = weekOptions.sort((a, b) => a - b).map(weeksAgo => {
    const range = weekRange(weeksAgo);
    const label = weeksAgo === 0 ? "本周" : `${weeksAgo} 周前`;
    return `<option value="${weeksAgo}" ${weeksAgo === reviewWeeksAgo ? "selected" : ""}>${label} · ${formatShortDate(range.start)}-${formatShortDate(range.end)}</option>`;
  }).join("");
  jumpSelect.onchange = () => setReviewWeek(Number(jumpSelect.value));
}

function setReviewWeek(weeksAgo) {
  reviewWeeksAgo = Math.max(0, Math.min(104, Number(weeksAgo) || 0));
  renderReview();
}

function deltaIndicatorClass(delta) {
  if (delta > 0) return "summary-delta delta-positive";
  if (delta < 0) return "summary-delta delta-negative";
  return "summary-delta delta-neutral";
}

function directionIndicatorClass(label) {
  if (label === "方向稳定") return "summary-delta delta-positive";
  if (label === "稍微偏了") return "summary-delta delta-warn";
  if (label === "明显偏离") return "summary-delta delta-negative";
  return "summary-delta delta-neutral";
}

function setReviewTab(tab) {
  document.querySelectorAll("[data-review-tab]").forEach(btn => {
    const active = btn.dataset.reviewTab === tab;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll("[data-review-panel]").forEach(panel => {
    panel.classList.toggle("hide", panel.dataset.reviewPanel !== tab);
  });
}

function renderGmnSplitBar(thisWeek) {
  const container = $("reviewGmnSplit");
  if (!container) return;
  const totalMinutes = totalMinutesOf(thisWeek);
  if (!totalMinutes) {
    container.innerHTML = `<div class="review-text-item">这一周还没有专注记录。</div>`;
    return;
  }
  const segments = [
    { label: "G 成长", cls: "gmn-g", minutes: totalMinutesOf(thisWeek.filter(l => l.gmn === "G")) },
    { label: "M 维护", cls: "gmn-m", minutes: totalMinutesOf(thisWeek.filter(l => l.gmn === "M")) },
    { label: "N 噪音", cls: "gmn-n", minutes: totalMinutesOf(thisWeek.filter(l => l.gmn === "N")) }
  ].filter(seg => seg.minutes > 0);
  container.innerHTML = `
    <div class="gmn-split-track">
      ${segments.map(seg => `<div class="gmn-split-segment ${seg.cls}" style="--share:${(seg.minutes / totalMinutes) * 100}%" title="${seg.label} · ${seg.minutes} min"></div>`).join("")}
    </div>
    <div class="gmn-split-legend">
      ${segments.map(seg => `<span class="gmn-split-legend-item ${seg.cls}">${seg.label} ${Math.round((seg.minutes / totalMinutes) * 100)}% · ${seg.minutes} min</span>`).join("")}
    </div>
  `;
}

function renderWeeklyFocusAreas(thisWeek, lastWeek) {
  const topAreas = collectTopAreas(thisWeek);
  const lastWeekAreas = collectTopAreas(lastWeek);
  const lastWeekMap = new Map(lastWeekAreas.map(area => [area.label, area.minutes]));
  const maxMinutes = Math.max(1, ...topAreas.map(area => area.minutes));
  $("reviewFocusAreas").innerHTML = topAreas.length ? topAreas.map(area => {
    const delta = area.minutes - Number(lastWeekMap.get(area.label) || 0);
    const quest = area.questId ? questById(area.questId) : null;
    const type = quest ? questTypeForQuest(quest) : "side";
    const widthPct = Math.max(6, Math.round((area.minutes / maxMinutes) * 100));
    return `
      <div class="time-allocation-row">
        <div class="time-allocation-label"><span>${escapeHtml(area.label)}</span><b>${area.minutes} min</b></div>
        <div class="time-allocation-track"><div class="time-allocation-fill ${typeClass(type)}" style="--share:${widthPct}%"></div></div>
        <small>${area.count} 次 · 较上周 ${formatMinuteDelta(delta)}${area.nextMove ? ` · ${escapeHtml(area.nextMove)}` : ""}</small>
      </div>
    `;
  }).join("") : `<div class="review-text-item">这一周还没有足够记录。</div>`;
}

function renderReviewHighlights(highlightLogs) {
  const container = $("reviewHighlights");
  if (!container) return;
  if (!highlightLogs.length) {
    container.innerHTML = `<div class="review-text-item">这一周还没有标记"⭐ 值得记录"的日志。专注结算时点一下"值得记录"，下次这里就会显示。</div>`;
    return;
  }
  container.innerHTML = `
    <div class="review-highlights-head"><b>⭐ 本周高光</b><span>${highlightLogs.length} 条</span></div>
    <div class="log-list">${highlightLogs.map(logCard).join("")}</div>
  `;
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
  const highlight = Boolean(log.worthRecording);
  return `
    <div class="log-card ${highlight ? "log-card-highlight" : ""}">
      <div class="row"><span class="pill">${highlight ? "⭐ " : ""}${log.date} · ${log.minutes || 20}min · ${log.gmn}${log.is_random_event ? " · 突发" : ""}${log.is_pivoted ? " · 转向" : ""}</span><small>${escapeHtml(q?.name || log.questId)} / ${escapeHtml(t?.current_title || t?.name || log.taskId)}</small></div>
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
  $("editTask").innerHTML = data.tasks.map(t => `<option value="${t.id}" ${t.id === log.taskId ? "selected" : ""}>${t.id} · ${escapeHtml(t.name)}</option>`).join("");
  $("editGmn").value = log.gmn;
  $("editWhat").value = log.whatDone || "";
  $("editProblem").value = log.problem || "";
  $("editSolution").value = log.solution || "";
  $("editGood").value = log.good || "";
  $("editBad").value = log.bad || "";
  $("editNext").value = log.nextStep || "";
  $("editLogModal").classList.remove("hide");
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
  $("editLogModal").classList.add("hide");
  save();
  renderAll();
}

function deleteLog(id) {
  if (!confirm("确定删除这条日志吗？")) return;
  data.logs = data.logs.filter(l => l.id !== id);
  save();
  renderAll();
}

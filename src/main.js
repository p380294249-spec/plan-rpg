// src/main.js
// Extracted from index.html during the safe modular refactor.

function closeModal(id) {
  $(id).classList.add("hide");
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("active", b.dataset.screen === id));
  if (id === "map") renderMap();
  if (id === "focus") renderFocus();
  if (id === "todos") renderTodos();
  if (id === "review") renderReview();
  if (id === "skills") renderSkills();
}

function renderAll() {
  applyMetricLogsToDashboard();
  renderGoals();
  renderSkillMini();
  renderMap();
  renderDetail();
  renderFocus();
  renderTodos();
  renderReview();
  renderSkills();
  renderModel();
  renderSheetSyncConfig();
  save();
}

function bootstrapPlanRpg() {
  data = loadData();
  todoUiState = readTodoUiState();
  document.querySelectorAll(".nav button").forEach(btn => btn.addEventListener("click", () => showScreen(btn.dataset.screen)));
  $("backToMapBtn").addEventListener("click", () => showScreen("map"));
  $("startPauseBtn").addEventListener("click", toggleTimer);
  $("resetBtn").addEventListener("click", resetTimer);
  $("cancelFocusInlineBtn").addEventListener("click", cancelActiveSessionWithConfirm);
  document.addEventListener("visibilitychange", () => {
    syncTimerWithClock();
    if (!document.hidden) {
      flushPendingSyncQueue({ silent: true }).then(() => pullTodosFromSheet({ silent: true }));
    }
  });
  window.addEventListener("online", () => {
    flushPendingSyncQueue({ silent: true }).then(() => pullTodosFromSheet({ silent: true }));
  });
  $("randomEventBtn").addEventListener("click", openRandomEventModal);
  $("pivotTaskBtn").addEventListener("click", openPivotModal);
  $("saveDraftBtn").addEventListener("click", saveDraft);
  $("saveSessionBtn").addEventListener("click", saveSession);
  $("updateLogBtn").addEventListener("click", updateLog);
  $("cancelEditBtn").addEventListener("click", () => {
    editingLogId = null;
    $("editPanel").classList.add("hide");
  });
  $("exportDataBtn").addEventListener("click", exportData);
  $("importDataBtn").addEventListener("click", () => $("importDataFile").click());
  $("importDataFile").addEventListener("change", importData);
  $("saveSheetSyncBtn").addEventListener("click", saveSheetSyncConfig);
  $("testSheetSyncBtn").addEventListener("click", testSheetSync);
  $("pullSheetLogsBtn").addEventListener("click", () => pullSessionLogsFromSheet());
  $("uploadLocalLogsBtn").addEventListener("click", uploadLocalSessionLogsToSheet);
  document.querySelectorAll("[data-collapse-toggle]").forEach(btn => {
    btn.addEventListener("click", () => toggleMapSection(btn.dataset.collapseToggle));
  });
  $("recordTypeSelect").addEventListener("change", (event) => setRecordType(event.target.value));
  $("saveMetricLogBtn").addEventListener("click", saveMetricLog);
  $("createRandomStartBtn").addEventListener("click", () => createRandomEvent(true));
  $("createRandomBtn").addEventListener("click", () => createRandomEvent(false));
  $("applyPivotBtn").addEventListener("click", applyPivot);
  document.querySelectorAll("[data-close-modal]").forEach(btn => btn.addEventListener("click", () => closeModal(btn.dataset.closeModal)));
  document.querySelectorAll(".pivot-option").forEach(btn => btn.addEventListener("click", () => setPivotType(btn.dataset.pivotType)));
  renderAll();
  flushPendingSyncQueue({ silent: true });
  pullSessionLogsFromSheet({ silent: true });
  pullMetricLogsFromSheet({ silent: true });
  pullTodosFromSheet({ silent: true });
}

bootstrapPlanRpg();

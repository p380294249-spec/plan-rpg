const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({
  console,
  Date,
  JSON,
  Math,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  Boolean,
  structuredClone,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  clearInterval: () => {}
});

[
  "src/config/app-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/storage/local-cache.js",
  "src/services/session-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const normalCompletion = JSON.parse(vm.runInContext(`
  data = structuredClone(seed);
  const normalTask = data.tasks.find(task => task.id !== MINDSET_CANONICAL_TASK_ID && task.questId !== MINDSET_CANONICAL_QUEST_ID);
  selectedTaskId = normalTask.id;
  selectedQuestId = normalTask.questId;
  timerTaskId = normalTask.id;
  timerSessionActive = true;
  running = true;
  timerEndsAt = Date.now() - 1000;
  seconds = 2;
  let renderCount = 0;
  let saveCount = 0;
  renderTimer = () => { renderCount += 1; };
  syncGoalForQuest = () => {};
  saveSession = () => { saveCount += 1; };
  syncTimerWithClock();
  JSON.stringify({
    running,
    timerSessionActive,
    timerEndsAt,
    seconds,
    selectedTaskId,
    selectedQuestId,
    renderCount,
    saveCount
  });
`, context));

assert.equal(normalCompletion.running, false);
assert.equal(normalCompletion.timerSessionActive, true);
assert.equal(normalCompletion.timerEndsAt, 0);
assert.equal(normalCompletion.seconds, 0);
assert.equal(normalCompletion.saveCount, 0);
assert.ok(normalCompletion.selectedTaskId);

const changedSelectionCompletion = JSON.parse(vm.runInContext(`
  data = structuredClone(seed);
  var changedStartedTask = data.tasks.find(task => task.id !== MINDSET_CANONICAL_TASK_ID && task.questId !== MINDSET_CANONICAL_QUEST_ID && task.recordMode !== "metric");
  var changedSelectedTask = data.tasks.find(task => task.id !== changedStartedTask.id && task.id !== MINDSET_CANONICAL_TASK_ID && task.questId !== MINDSET_CANONICAL_QUEST_ID && task.recordMode !== "metric");
  selectedTaskId = changedSelectedTask.id;
  selectedQuestId = changedSelectedTask.questId;
  timerTaskId = changedStartedTask.id;
  timerSessionActive = true;
  running = true;
  timerEndsAt = Date.now() - 1000;
  seconds = 2;
  renderTimer = () => {};
  syncGoalForQuest = () => {};
  saveSession = () => {};
  syncTimerWithClock();
  JSON.stringify({
    selectedTaskId,
    selectedQuestId,
    timerTaskId,
    timerSessionActive
  });
`, context));

assert.notEqual(changedSelectionCompletion.selectedTaskId, changedSelectionCompletion.timerTaskId);
assert.equal(changedSelectionCompletion.timerSessionActive, true);

const meditationCompletion = JSON.parse(vm.runInContext(`
  data = structuredClone(seed);
  const meditationTask = data.tasks.find(task => task.id === MINDSET_CANONICAL_TASK_ID);
  selectedTaskId = meditationTask.id;
  selectedQuestId = meditationTask.questId;
  timerTaskId = meditationTask.id;
  timerSessionActive = true;
  running = true;
  timerEndsAt = Date.now() - 1000;
  seconds = 2;
  let meditationSaveCount = 0;
  renderTimer = () => {};
  syncGoalForQuest = () => {};
  saveSession = () => { meditationSaveCount += 1; };
  syncTimerWithClock();
  JSON.stringify({
    running,
    timerSessionActive,
    timerEndsAt,
    seconds,
    meditationSaveCount
  });
`, context));

assert.equal(meditationCompletion.running, false);
assert.equal(meditationCompletion.timerSessionActive, false);
assert.equal(meditationCompletion.timerEndsAt, 0);
assert.equal(meditationCompletion.seconds, 0);
assert.equal(meditationCompletion.meditationSaveCount, 1);

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const mapSectionEnd = indexHtml.indexOf("</section>", indexHtml.indexOf('<section id="map"'));
const activePanelIndex = indexHtml.indexOf('id="activeTimerPanel"');
assert.ok(activePanelIndex > mapSectionEnd, "active timer panel should live outside the map screen");

const renderFocusJs = fs.readFileSync(path.join(root, "src/ui/render-focus.js"), "utf8");
assert.ok(
  renderFocusJs.includes('timerSessionActive && timerTaskId ? "session"'),
  "active unfinished sessions should force the focus screen back to session record mode"
);

const renderDashboardJs = fs.readFileSync(path.join(root, "src/ui/render-dashboard.js"), "utf8");
assert.ok(
  renderDashboardJs.includes('setRecordType("session")'),
  "floating timer return action should reveal the session settlement form"
);

const stylesCss = fs.readFileSync(path.join(root, "src/ui/styles.css"), "utf8");
assert.ok(
  stylesCss.includes("#focus.record-mode-metric .focus-grid"),
  "metric log mode should use its own compact layout"
);
assert.ok(
  stylesCss.includes("#focus.simple-session #sessionLogPanel textarea"),
  "ordinary focus sessions should use the simplified one-field log layout"
);

assert.ok(
  indexHtml.includes("advanced-session-action"),
  "advanced random/pivot/draft actions should be hidden from the main focus flow"
);
assert.ok(
  indexHtml.includes('id="focusChoiceBoard"'),
  "focus screen should expose the button-based task selector"
);
assert.ok(
  indexHtml.includes('id="worthRecordBtn"'),
  "focus screen should expose the worth-recording toggle"
);

const sessionServiceJs = fs.readFileSync(path.join(root, "src/services/session-service.js"), "utf8");
assert.ok(
  sessionServiceJs.includes('problem: meditation ? feeling : ""'),
  "ordinary sessions should not save hidden reflection-field leftovers"
);
assert.ok(
  sessionServiceJs.includes('moodStress: meditation ? feeling : ""'),
  "ordinary sessions should not save hidden mood-field leftovers"
);
assert.ok(
  sessionServiceJs.includes("worthRecording: Boolean(currentSessionWorthRecording)"),
  "session logs should persist the worth-recording flag"
);

assert.ok(
  renderFocusJs.includes("renderFocusChoiceBoard"),
  "focus render should build button-based task choices"
);
assert.ok(
  !renderFocusJs.includes("<span>行动</span>"),
  "focus selector should stay at goal/module level and not add an extra action layer"
);
assert.ok(
  !renderFocusJs.includes("confirmStartNewSession(nextTaskId)"),
  "clicking focus selector buttons should not trigger the active-session switch prompt"
);
assert.ok(
  renderFocusJs.includes("reward-strip"),
  "focus reward preview should use the compact reward strip"
);

const settlementChoice = JSON.parse(vm.runInContext(`
  data = structuredClone(seed);
  var settlementStartedTask = data.tasks.find(task => task.id !== MINDSET_CANONICAL_TASK_ID && task.recordMode !== "metric");
  var settlementSelectedTask = data.tasks.find(task => task.id !== settlementStartedTask.id && task.id !== MINDSET_CANONICAL_TASK_ID && task.recordMode !== "metric");
  timerSessionActive = true;
  timerTaskId = settlementStartedTask.id;
  selectedTaskId = settlementSelectedTask.id;
  selectedQuestId = settlementSelectedTask.questId;
  prompt = () => "2";
  syncGoalForQuest = () => {};
  const ok = resolveSessionTaskBeforeSave();
  JSON.stringify({ ok, selectedTaskId, expectedTaskId: settlementSelectedTask.id });
`, context));

assert.equal(settlementChoice.ok, true);
assert.equal(settlementChoice.selectedTaskId, settlementChoice.expectedTaskId);

const sheetApiJs = fs.readFileSync(path.join(root, "src/storage/sheet-api.js"), "utf8");
assert.ok(
  sheetApiJs.includes("worth_recording"),
  "Google Sheet sync should include the worth-recording field"
);

const appsScriptJs = fs.readFileSync(path.join(root, "google-apps-script/Code.gs"), "utf8");
assert.ok(
  appsScriptJs.includes("SESSION_LOG_HEADERS") && appsScriptJs.includes("worth_recording"),
  "Apps Script should keep the Session_Logs schema compatible with worth-recording sync"
);

console.log("Plan RPG timer completion tests passed.");

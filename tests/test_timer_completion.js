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

const sessionServiceJs = fs.readFileSync(path.join(root, "src/services/session-service.js"), "utf8");
assert.ok(
  sessionServiceJs.includes('problem: meditation ? feeling : ""'),
  "ordinary sessions should not save hidden reflection-field leftovers"
);
assert.ok(
  sessionServiceJs.includes('moodStress: meditation ? feeling : ""'),
  "ordinary sessions should not save hidden mood-field leftovers"
);

console.log("Plan RPG timer completion tests passed.");

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
  }
});

[
  "src/config/app-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/storage/local-cache.js",
  "src/services/session-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const result = JSON.parse(vm.runInContext(`
  data = structuredClone(seed);
  const currentRange = weekRange(0);
  const previousRange = weekRange(1);
  const day = date => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
  data.logs = [
    { id: "current", date: day(currentRange.start), minutes: 20, gmn: "G" },
    { id: "previous", date: day(previousRange.start), minutes: 35, gmn: "M" }
  ];
  JSON.stringify({
    currentIds: logsForWeek(0).map(log => log.id),
    previousIds: logsForWeek(1).map(log => log.id),
    previousMinutes: totalMinutesOf(logsForWeek(1)),
    focus: weeklyCommandFocus.map(item => ({
      title: item.title,
      questId: item.questId,
      taskId: item.taskId
    }))
  });
`, context));

assert.deepEqual(result.currentIds, ["current"]);
assert.deepEqual(result.previousIds, ["previous"]);
assert.equal(result.previousMinutes, 35);
assert.deepEqual(result.focus, [
  { title: "DFK 核对财务和制定制度", questId: "Q-010", taskId: "T-002" },
  { title: "INSO 快速开发系统", questId: "Q-012", taskId: "T-016" }
]);

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(indexHtml.includes('data-screen="review">周复盘</button>'));
assert.ok(indexHtml.includes('id="reviewPreviousWeekBtn"'));
assert.ok(indexHtml.includes('id="reviewCurrentWeekBtn"'));
assert.ok(indexHtml.includes('id="reviewNextWeekBtn"'));

console.log("Plan RPG weekly review tests passed.");

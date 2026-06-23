const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const localStorageData = new Map();
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
    getItem: key => localStorageData.get(key) || null,
    setItem: (key, value) => localStorageData.set(key, String(value))
  }
});

[
  "src/config/app-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/storage/local-cache.js",
  "src/storage/sheet-api.js",
  "src/services/task-service.js",
  "src/services/todo-service.js",
  "src/services/session-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const result = JSON.parse(vm.runInContext(`
  const month = monthKey();
  const year = yearKey();
  const monthNumber = Number(month.slice(5, 7));
  const previousMonth = monthNumber > 1
    ? year + "-" + String(monthNumber - 1).padStart(2, "0")
    : String(Number(year) - 1) + "-12";
  const previousYear = previousMonth.slice(0, 4) === year;
  data = normalizeData({
    metricLogs: [
      { id: "dfk-1", date: month + "-05", goalId: "BUSINESS", metricType: "DFK 装柜", value: 3, unit: "柜" },
      { id: "dfk-2", date: month + "-12", goalId: "BUSINESS", metricType: "装柜数量", value: 2, unit: "柜" },
      { id: "dfk-old", date: previousMonth + "-10", goalId: "BUSINESS", metricType: "DFK 装柜", value: 4, unit: "柜" },
      { id: "inso-1", date: month + "-15", goalId: "BUSINESS", metricType: "INSO 收入", value: 6000, unit: "RMB" }
    ],
    logs: [{ id: "old-print-log", date: month + "-01", questId: "Q-018", taskId: "T-012", actual_task_id: "T-012" }],
    quests: [
      { id: "Q-018", name: "打印", goal: "BUSINESS" },
      { id: "Q-010", name: "财务", gmn: "G" },
      { id: "Q-016", name: "培训系统", gmn: "G" }
    ]
  });
  const dfk = questById("Q-001");
  const inso = questById("Q-003");
  const summary = monthlyMetricSummary("Q-001");
  const annual = annualMetricTotal("Q-001");
  const beforeReset = {
    dfk: { current: dfk.currentValue, target: dfk.targetValue },
    inso: { current: inso.currentValue, target: inso.targetValue }
  };
  const chapters = chapterQuestsForCampaign("Q-001").map(quest => ({ id: quest.id, name: quest.name, gmn: quest.gmn }));
  const normalizedLog = data.logs.find(log => log.id === "old-print-log");
  data.metricLogs = data.metricLogs.filter(log => monthKey(log.date) !== month);
  applyMetricLogsToDashboard();
  JSON.stringify({
    dfk: beforeReset.dfk,
    inso: beforeReset.inso,
    summary,
    annual,
    expectedAnnual: previousYear ? 9 : 5,
    chapters,
    normalizedLogQuestId: normalizedLog.questId,
    resetCurrent: questById("Q-001").currentValue
  });
`, context));

assert.equal(result.summary.value, 5);
assert.equal(result.summary.target, 30);
assert.equal(result.summary.progress, 17);
assert.equal(result.inso.current, 6000);
assert.equal(result.inso.target, 10000);
assert.equal(result.annual, result.expectedAnnual);
assert.equal(result.resetCurrent, 0);
assert.deepEqual(result.chapters, [
  { id: "Q-009", name: "公司系统维护", gmn: "G" },
  { id: "Q-010", name: "公司内部管理", gmn: "M" },
  { id: "Q-016", name: "客户与物流事务", gmn: "N" }
]);
assert.equal(result.normalizedLogQuestId, "Q-009");

console.log("Plan RPG monthly business metric tests passed.");

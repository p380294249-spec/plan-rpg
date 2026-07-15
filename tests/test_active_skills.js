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
  "src/game/game-config.js",
  "src/skills/skill-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/services/task-service.js",
  "src/services/session-service.js",
  "src/storage/local-cache.js",
  "src/skills/skill-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const result = JSON.parse(vm.runInContext(`
  data = normalizeData({
    logs: [
      { id: "L-F1", date: "2026-07-15", minutes: 20, questId: "Q-009", taskId: "T-001" },
      { id: "L-F2", date: "2026-07-15", minutes: 40, questId: "Q-009", taskId: "T-001" },
      { id: "L-M1", date: "2026-07-15", minutes: 10, questId: "Q-004", taskId: "T-007" }
    ],
    skills: [
      { id: "strategy", name: "Strategy / 战略判断", level: 9, xp: 88, maxXp: 120 }
    ]
  });
  const states = activeSkillStates();
  const focus = activeSkillStateById("focus");
  const sales = activeSkillStateById("sales");
  JSON.stringify({
    ids: states.map(skill => skill.id),
    focusLifetime: focus.lifetimeProgress,
    focusLevel: focus.level,
    focusRecent: focus.recentActivity.length,
    salesStatus: sales.progressionStatus,
    legacyStrategyLevel: data.legacySkills.find(skill => skill.id === "strategy").level,
    legacyStrategyArchived: data.legacySkills.find(skill => skill.id === "strategy").archived,
    dataSkillsStillLegacy: data.skills.find(skill => skill.id === "strategy").legacy
  });
`, context));

assert.deepEqual(result.ids, ["focus", "sales", "communication", "language", "management", "investment", "ai-systems"]);
assert.equal(result.focusLifetime, 3);
assert.equal(result.focusLevel, 1);
assert.equal(result.focusRecent, 2);
assert.equal(result.salesStatus, "planned");
assert.equal(result.legacyStrategyLevel, 9);
assert.equal(result.legacyStrategyArchived, true);
assert.equal(result.dataSkillsStillLegacy, true);

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(indexHtml.includes("src/skills/skill-config.js"));
assert.ok(indexHtml.includes("src/skills/skill-service.js"));

console.log("Plan RPG active skills tests passed.");

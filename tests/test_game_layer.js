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
    setItem: (key, value) => localStorageData.set(key, String(value)),
    removeItem: key => localStorageData.delete(key)
  },
  navigator: { userAgent: "test" },
  document: { createElement: () => ({ remove: () => {} }), body: { appendChild: () => {} } },
  setTimeout: () => 0,
  clearTimeout: () => {}
});

[
  "src/config/app-config.js",
  "src/game/game-config.js",
  "src/models/seed-data.js",
  "src/state/app-state.js",
  "src/services/task-service.js",
  "src/services/session-service.js",
  "src/storage/local-cache.js",
  "src/game/game-service.js"
].forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));

const result = JSON.parse(vm.runInContext(`
  data = normalizeData({
    logs: [
      { id: "L-A", date: todayISO(), minutes: 20, questId: "Q-009", taskId: "T-001", actual_task_id: "T-001" },
      { id: "L-B", date: todayISO(), minutes: 20, questId: "Q-009", taskId: "T-001", actual_task_id: "T-001" },
      { id: "L-C", date: todayISO(), minutes: 20, questId: "Q-009", taskId: "T-001", actual_task_id: "T-001" },
      { id: "L-D", date: todayISO(), minutes: 20, questId: "Q-009", taskId: "T-001", actual_task_id: "T-001" },
      { id: "L-E", date: todayISO(), minutes: 20, questId: "Q-009", taskId: "T-001", actual_task_id: "T-001" }
    ],
    gameEvents: []
  });
  const before = focusMissionStatus();
  const rewardEvent = drawRewardForMission("daily");
  const after = focusMissionStatus();
  const inventoryBeforeUse = rewardInventoryItems();
  useRewardInstance(rewardEvent.rewardInstanceId);
  const inventoryAfterUse = rewardInventoryItems();
  JSON.stringify({
    beforeCanClaim: before.daily.canClaim,
    beforeProgress: before.daily.progress,
    rewardEventType: rewardEvent.eventType,
    rewardStatus: rewardEvent.status,
    afterClaimed: after.daily.claimed,
    afterCanClaim: after.daily.canClaim,
    inventoryBeforeUseCount: inventoryBeforeUse.reduce((sum, item) => sum + item.count, 0),
    inventoryAfterUseCount: inventoryAfterUse.reduce((sum, item) => sum + item.count, 0),
    gameEventCount: data.gameEvents.length
  });
`, context));

assert.equal(result.beforeCanClaim, true);
assert.equal(result.beforeProgress, 100);
assert.equal(result.rewardEventType, "reward_drawn");
assert.equal(result.rewardStatus, "saved");
assert.equal(result.afterClaimed, true);
assert.equal(result.afterCanClaim, false);
assert.equal(result.inventoryBeforeUseCount, 1);
assert.equal(result.inventoryAfterUseCount, 0);
assert.equal(result.gameEventCount, 2);

const configText = fs.readFileSync(path.join(root, "src/game/game-config.js"), "utf8");
assert.ok(configText.includes("rarityWeights"));
assert.ok(configText.includes("rewardPools"));
assert.ok(configText.includes("Legendary"));

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(indexHtml.includes('data-screen="game"'));
assert.ok(indexHtml.includes('id="rewardModal"'));
assert.ok(indexHtml.includes("src/game/game-service.js"));

console.log("Plan RPG game layer tests passed.");

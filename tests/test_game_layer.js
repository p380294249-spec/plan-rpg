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
  Math.random = () => 0;
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
  const prepared = prepareRewardDraw("daily", 0);
  const preparedNotCommitted = !missionClaimed(prepared.missionKey);
  const rewardEvent = commitRewardDraw(prepared);
  const drawn = allRewardInstances()[0];
  const redeemingEvent = startRewardRedemption(drawn.id);
  const earlyComplete = completeRewardRedemption(drawn.id);
  const redeemingRow = data.gameEvents.find(event => event.id === redeemingEvent.id);
  redeemingRow.createdAt = new Date(Date.now() - 21 * 60000).toISOString();
  const completedEvent = completeRewardRedemption(drawn.id);

  const expiredDraw = normalizeGameEvents([{
    id: "GE-EXPIRED",
    eventType: "reward_drawn",
    skillId: "FOCUS",
    missionType: "weekly",
    missionKey: "FOCUS:weekly:expired-test",
    rewardInstanceId: "RW-EXPIRED",
    rewardId: "coffee-fund",
    rewardName: "手冲咖啡 / 咖啡基金",
    rewardType: "Consumption Reward",
    rarity: "Rare",
    status: "unredeemed",
    payload: { reward: GAME_CONFIG.rewardPools.FOCUS.find(item => item.id === "coffee-fund"), expiresAt: Date.now() - 1 },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  }])[0];
  data.gameEvents.unshift(expiredDraw);
  const expiryEvents = scanExpiredRewardInstances();

  for (let index = 0; index < 13; index += 1) {
    data.gameEvents.unshift(normalizeGameEvents([{
      id: "GE-PITY-" + index,
      eventType: "reward_drawn",
      skillId: "FOCUS",
      missionType: "weekly",
      missionKey: "FOCUS:weekly:pity-" + index,
      rewardInstanceId: "RW-PITY-" + index,
      rewardId: "gaming-20",
      rewardName: "20分钟游戏",
      rewardType: "Time Reward",
      rarity: "Common",
      status: "unredeemed",
      payload: { reward: GAME_CONFIG.rewardPools.FOCUS.find(item => item.id === "gaming-20") },
      createdAt: new Date(Date.now() + index + 1).toISOString()
    }])[0]);
  }
  const stats = rewardRedemptionStats();
  JSON.stringify({
    beforeCanClaim: before.daily.canClaim,
    preparedNotCommitted,
    preparedStatus: prepared.status,
    rewardEventType: rewardEvent.eventType,
    afterClaimed: focusMissionStatus().daily.claimed,
    drawnStatus: drawn.status,
    redeemingEventType: redeemingEvent.eventType,
    earlyCompleteWasBlocked: earlyComplete === null,
    completedEventType: completedEvent.eventType,
    completedStatus: allRewardInstances().find(item => item.id === drawn.id).status,
    expiryEvents,
    expiredStatus: allRewardInstances().find(item => item.id === "RW-EXPIRED").status,
    forcedRarity: chooseRarity(adjustedRarityWeights(), 0.2),
    statsRate: stats.rate,
    statsWarning: stats.warning
  });
`, context));

assert.equal(result.beforeCanClaim, true);
assert.equal(result.preparedNotCommitted, true);
assert.equal(result.preparedStatus, "unredeemed");
assert.equal(result.rewardEventType, "reward_drawn");
assert.equal(result.afterClaimed, true);
assert.equal(result.drawnStatus, "unredeemed");
assert.equal(result.redeemingEventType, "reward_redeeming");
assert.equal(result.earlyCompleteWasBlocked, true);
assert.equal(result.completedEventType, "reward_completed");
assert.equal(result.completedStatus, "completed");
assert.equal(result.expiryEvents, 1);
assert.equal(result.expiredStatus, "expired");
assert.equal(result.forcedRarity, "Legendary");
assert.equal(result.statsRate, 50);
assert.equal(result.statsWarning, true);

const configText = fs.readFileSync(path.join(root, "src/game/game-config.js"), "utf8");
assert.ok(configText.includes("chargeMs: 2000"));
assert.ok(configText.includes("forceAt: 15"));
assert.ok(configText.includes("durationMinutes: 20"));

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.ok(indexHtml.includes('data-screen="game"'));
assert.ok(indexHtml.includes('id="rewardModal"'));
assert.ok(indexHtml.includes("src/game/game-service.js"));

console.log("Plan RPG game layer tests passed.");

// src/game/game-service.js
// Game layer built on top of existing focus logs. Existing PLAN data remains source of truth.

function gameParseDate(value = todayISO()) {
  const text = String(value || todayISO()).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function gameDateKey(value = todayISO()) {
  const date = gameParseDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function gameStartOfWeek(date = new Date()) {
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = current.getDay();
  current.setDate(current.getDate() + (day === 0 ? -6 : 1 - day));
  current.setHours(0, 0, 0, 0);
  return current;
}

function gameWeekRange(date = new Date()) {
  const start = gameStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function gameWeekKey(date = new Date()) {
  return gameDateKey(gameStartOfWeek(date));
}

function gameEventDate(event) {
  return event.createdAt || event.created_at || event.date || todayISO();
}

function focusUnitsForLog(log) {
  const unitMinutes = GAME_CONFIG.skills.FOCUS.unitMinutes;
  return Math.max(0, Number(log.minutes || unitMinutes) / unitMinutes);
}

function roundedFocusUnits(value) {
  const rounded = Math.round(Number(value || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function focusLogsForDay(dateKey = todayISO()) {
  return (data.logs || []).filter(log => gameDateKey(log.date) === dateKey);
}

function focusLogsForWeek(date = new Date()) {
  const { start, end } = gameWeekRange(date);
  return (data.logs || []).filter(log => {
    const parsed = gameParseDate(log.date);
    return parsed >= start && parsed <= end;
  });
}

function focusUnitsForLogs(logs = []) {
  return logs.reduce((sum, log) => sum + focusUnitsForLog(log), 0);
}

function gameDrawEvents(skillId = "FOCUS") {
  return (data.gameEvents || [])
    .filter(event => event.eventType === "reward_drawn" && event.skillId === skillId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function missionClaimed(missionKey) {
  return gameDrawEvents().some(event => event.missionKey === missionKey);
}

function focusMissionStatus(date = new Date()) {
  const dayKey = gameDateKey(date);
  const weekKey = gameWeekKey(date);
  const dailyUnits = focusUnitsForLogs(focusLogsForDay(dayKey));
  const weeklyUnits = focusUnitsForLogs(focusLogsForWeek(date));
  const dailyTarget = GAME_CONFIG.skills.FOCUS.dailyTarget;
  const weeklyTarget = GAME_CONFIG.skills.FOCUS.weeklyTarget;
  const dailyKey = `FOCUS:daily:${dayKey}`;
  const weeklyMissionKey = `FOCUS:weekly:${weekKey}`;
  return {
    daily: gameMissionRow("daily", dailyKey, dailyUnits, dailyTarget, "今日"),
    weekly: gameMissionRow("weekly", weeklyMissionKey, weeklyUnits, weeklyTarget, "本周")
  };
}

function gameMissionRow(type, key, units, target, label) {
  const claimed = missionClaimed(key);
  const complete = units >= target;
  return {
    type,
    key,
    label,
    units,
    target,
    progress: target ? Math.min(100, Math.round((units / target) * 100)) : 0,
    complete,
    claimed,
    canClaim: complete && !claimed
  };
}

function focusLevelState() {
  const lifetimeUnits = focusUnitsForLogs(data.logs || []);
  const levelStep = GAME_CONFIG.skills.FOCUS.levelStep;
  const level = Math.max(1, Math.floor(lifetimeUnits / levelStep) + 1);
  const currentLevelStart = (level - 1) * levelStep;
  const nextLevelAt = level * levelStep;
  const progress = Math.min(100, Math.round(((lifetimeUnits - currentLevelStart) / levelStep) * 100));
  const title = [...GAME_CONFIG.skills.FOCUS.titles]
    .sort((a, b) => b.minLevel - a.minLevel)
    .find(item => level >= item.minLevel)?.title || "专注新兵";
  return { lifetimeUnits, level, title, currentLevelStart, nextLevelAt, progress };
}

function rarityRank(rarity) {
  return GAME_RARITIES.indexOf(rarity);
}

function pityCounterFor(rarity) {
  const targetRank = rarityRank(rarity);
  let count = 0;
  for (const event of gameDrawEvents()) {
    if (rarityRank(event.rarity) >= targetRank) break;
    count += 1;
  }
  return count;
}

function gamePityState() {
  return {
    Epic: pityCounterFor("Epic"),
    Legendary: pityCounterFor("Legendary")
  };
}

function legendaryPityTriggered(pity = gamePityState()) {
  return pity.Legendary >= Math.max(0, Number(GAME_CONFIG.pity.Legendary.forceAt || 15) - 1);
}

function adjustedRarityWeights() {
  const weights = { ...GAME_CONFIG.rarityWeights };
  const pity = gamePityState();
  const legendaryConfig = GAME_CONFIG.pity.Legendary;
  if (legendaryPityTriggered(pity)) {
    return { Common: 0, Rare: 0, Epic: 0, Legendary: 100 };
  }

  const epicConfig = GAME_CONFIG.pity.Epic;
  if (pity.Epic >= epicConfig.startsAfter) {
    const epicBonus = Math.min(epicConfig.maxBonus, (pity.Epic - epicConfig.startsAfter + 1) * epicConfig.increment);
    weights.Epic += epicBonus;
    weights.Common = Math.max(0, weights.Common - epicBonus);
  }

  if (pity.Legendary >= legendaryConfig.startsAfter) {
    const legendaryBonus = Math.min(legendaryConfig.maxBonus, (pity.Legendary - legendaryConfig.startsAfter + 1) * legendaryConfig.increment);
    weights.Legendary += legendaryBonus;
    const commonTake = Math.min(weights.Common, legendaryBonus);
    weights.Common -= commonTake;
    weights.Rare = Math.max(0, weights.Rare - (legendaryBonus - commonTake));
  }
  return weights;
}

function chooseRarity(weights = adjustedRarityWeights(), roll = Math.random()) {
  const total = GAME_RARITIES.reduce((sum, rarity) => sum + Number(weights[rarity] || 0), 0);
  let cursor = roll * total;
  for (const rarity of GAME_RARITIES) {
    cursor -= Number(weights[rarity] || 0);
    if (cursor <= 0) return rarity;
  }
  return "Common";
}

function rewardPoolFor(skillId = "FOCUS", rarity = "Common") {
  const pool = GAME_CONFIG.rewardPools[skillId] || [];
  return pool.filter(reward => reward.rarity === rarity);
}

function chooseReward(skillId, rarity) {
  const pool = rewardPoolFor(skillId, rarity);
  const fallback = GAME_CONFIG.rewardPools[skillId] || [];
  const candidates = pool.length ? pool : fallback;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function rewardFlowConfig() {
  return GAME_CONFIG.rewardFlow || {
    chargeMs: 2000,
    burstMs: { Common: 600, Rare: 1400, Epic: 1800, Legendary: 2600 },
    expiryDays: { Common: 3, Rare: 7, Epic: 14, Legendary: 30 },
    urgentExpiryHours: 24
  };
}

function gameEventTimestamp(event) {
  const timestamp = new Date(event?.createdAt || event?.updatedAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function rewardEventsForInstance(instanceId) {
  return (data.gameEvents || [])
    .filter(event => event.rewardInstanceId === instanceId)
    .sort((left, right) => gameEventTimestamp(left) - gameEventTimestamp(right));
}

function rewardConfigSnapshot(drawEvent) {
  const fromDraw = drawEvent?.payload?.reward;
  if (fromDraw && typeof fromDraw === "object") return fromDraw;
  return (GAME_CONFIG.rewardPools[drawEvent?.skillId || "FOCUS"] || [])
    .find(reward => reward.id === drawEvent?.rewardId) || {};
}

function rewardExpiryAt(drawEvent) {
  const snapshot = rewardConfigSnapshot(drawEvent);
  const storedExpiry = Number(drawEvent?.payload?.expiresAt || snapshot.expiresAt || 0);
  if (storedExpiry) return storedExpiry;
  const days = Number(snapshot.expireDays || rewardFlowConfig().expiryDays[drawEvent?.rarity] || 3);
  return gameEventTimestamp(drawEvent) + days * 86400000;
}

function rewardLifecycleForDraw(drawEvent, now = Date.now()) {
  const events = rewardEventsForInstance(drawEvent.rewardInstanceId);
  const lifecycleEvents = events.filter(event => event.eventType !== "reward_drawn");
  const latest = lifecycleEvents[lifecycleEvents.length - 1];
  const reward = rewardConfigSnapshot(drawEvent);
  const expiryAt = rewardExpiryAt(drawEvent);
  let status = "unredeemed";
  let redeemStartedAt = null;
  let completedAt = null;
  let note = "";

  const redeemEvent = lifecycleEvents.find(event => event.eventType === "reward_redeeming");
  const completeEvent = lifecycleEvents.find(event => event.eventType === "reward_completed" || event.eventType === "reward_used");
  const expiredEvent = lifecycleEvents.find(event => event.eventType === "reward_expired");
  if (completeEvent) {
    status = "completed";
    completedAt = gameEventTimestamp(completeEvent);
    note = String(completeEvent.payload?.note || "");
  } else if (expiredEvent) {
    status = "expired";
  } else if (redeemEvent) {
    status = "redeeming";
    redeemStartedAt = gameEventTimestamp(redeemEvent);
  } else if (now > expiryAt) {
    status = "expired";
  }
  if (redeemEvent) redeemStartedAt = gameEventTimestamp(redeemEvent);

  return {
    id: drawEvent.rewardInstanceId,
    drawEvent,
    reward,
    events,
    latestEvent: latest || drawEvent,
    rarity: drawEvent.rarity,
    rewardId: drawEvent.rewardId,
    rewardName: drawEvent.rewardName,
    rewardType: drawEvent.rewardType,
    icon: reward.icon || "✦",
    redemptionType: reward.redemptionType || (String(drawEvent.rewardType).includes("Time") ? "time" : "simple"),
    durationMinutes: Number(reward.durationMinutes || reward.value || 0),
    expiresAt: expiryAt,
    status,
    redeemStartedAt,
    completedAt,
    note
  };
}

function allRewardInstances(now = Date.now()) {
  return gameDrawEvents().map(event => rewardLifecycleForDraw(event, now));
}

function rewardInventoryInstances(now = Date.now()) {
  return allRewardInstances(now)
    .filter(item => item.status === "unredeemed" || item.status === "redeeming")
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === "redeeming" ? -1 : 1;
      return left.expiresAt - right.expiresAt;
    });
}

function rewardTimeRemainingSeconds(instance, now = Date.now()) {
  if (instance?.redemptionType !== "time" || !instance.redeemStartedAt) return 0;
  const totalSeconds = Math.max(0, Number(instance.durationMinutes || 0) * 60);
  return Math.max(0, totalSeconds - Math.floor((now - instance.redeemStartedAt) / 1000));
}

function canCompleteRewardRedemption(instance, now = Date.now()) {
  return instance?.status === "redeeming" && rewardTimeRemainingSeconds(instance, now) === 0;
}

function createRewardLifecycleEvent(drawEvent, eventType, status, payload = {}) {
  return normalizeGameEvents([{
    id: newId("GE"),
    eventType,
    skillId: drawEvent.skillId,
    missionType: drawEvent.missionType,
    missionKey: drawEvent.missionKey,
    rewardInstanceId: drawEvent.rewardInstanceId,
    rewardId: drawEvent.rewardId,
    rewardName: drawEvent.rewardName,
    rewardType: drawEvent.rewardType,
    rarity: drawEvent.rarity,
    status,
    sourceLogId: drawEvent.sourceLogId || "",
    payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }])[0];
}

function appendGameEvent(event) {
  data.gameEvents.unshift(event);
  save();
  if (typeof syncGameEventToSheet === "function") syncGameEventToSheet(event, { silent: true });
  return event;
}

function scanExpiredRewardInstances(now = Date.now()) {
  const expired = allRewardInstances(now).filter(item => item.status === "expired" && !item.events.some(event => event.eventType === "reward_expired"));
  expired.forEach(item => appendGameEvent(createRewardLifecycleEvent(item.drawEvent, "reward_expired", "expired", {
    expiredAt: new Date(now).toISOString(),
    expiresAt: item.expiresAt
  })));
  return expired.length;
}

function prepareRewardDraw(missionType, roll = Math.random()) {
  const mission = focusMissionStatus()[missionType];
  if (!mission || !mission.canClaim) return null;
  const weights = adjustedRarityWeights();
  const rarity = chooseRarity(weights, roll);
  const reward = chooseReward("FOCUS", rarity);
  if (!reward) return null;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(createdAt).getTime() + Number(reward.expireDays || rewardFlowConfig().expiryDays[rarity] || 3) * 86400000;
  const sourceTask = taskById(lastSession?.actual_task_id || lastSession?.taskId || "");
  return normalizeGameEvents([{
    id: newId("GE"),
    eventType: "reward_drawn",
    skillId: "FOCUS",
    missionType,
    missionKey: mission.key,
    rewardInstanceId: newId("RW"),
    rewardId: reward.id,
    rewardName: reward.name,
    rewardType: reward.type,
    rarity,
    status: "unredeemed",
    sourceLogId: lastSession?.id || "",
    payload: {
      reward,
      expiresAt,
      sourceTaskId: sourceTask?.id || "",
      mission: { units: mission.units, target: mission.target },
      pity: gamePityState(),
      weights,
      pityTriggered: rarity === "Legendary" && legendaryPityTriggered(gamePityState())
    },
    createdAt,
    updatedAt: createdAt
  }])[0];
}

function commitRewardDraw(event) {
  if (!event || missionClaimed(event.missionKey)) return null;
  return appendGameEvent(event);
}

function drawRewardForMission(missionType, roll = Math.random()) {
  return commitRewardDraw(prepareRewardDraw(missionType, roll));
}

function startRewardRedemption(instanceId) {
  const instance = allRewardInstances().find(item => item.id === instanceId);
  if (!instance || instance.status !== "unredeemed") return null;
  return appendGameEvent(createRewardLifecycleEvent(instance.drawEvent, "reward_redeeming", "redeeming", {
    startedFromEventId: instance.drawEvent.id,
    expiresAt: instance.expiresAt
  }));
}

function completeRewardRedemption(instanceId, note = "", now = Date.now()) {
  const instance = allRewardInstances(now).find(item => item.id === instanceId);
  if (!instance || !canCompleteRewardRedemption(instance, now)) return null;
  return appendGameEvent(createRewardLifecycleEvent(instance.drawEvent, "reward_completed", "completed", {
    completedFromEventId: instance.latestEvent.id,
    note: String(note || "").trim()
  }));
}

// Compatibility for old callers. The UI now uses the strict two-step redemption flow.
function useRewardInstance(instanceId) {
  const started = startRewardRedemption(instanceId);
  if (!started) return null;
  return completeRewardRedemption(instanceId);
}

function rewardRedemptionStats(now = Date.now()) {
  const instances = allRewardInstances(now);
  const completed = instances.filter(item => item.status === "completed").length;
  const expired = instances.filter(item => item.status === "expired").length;
  const settled = completed + expired;
  return {
    issued: instances.length,
    completed,
    expired,
    active: instances.filter(item => item.status === "unredeemed" || item.status === "redeeming").length,
    rate: settled ? Math.round((completed / settled) * 100) : null,
    warning: settled > 0 && Math.round((completed / settled) * 100) < 60
  };
}

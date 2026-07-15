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
    daily: gameMissionRow("daily", dailyKey, dailyUnits, dailyTarget, "TODAY"),
    weekly: gameMissionRow("weekly", weeklyMissionKey, weeklyUnits, weeklyTarget, "WEEK")
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
    .find(item => level >= item.minLevel)?.title || "Starter";
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

function adjustedRarityWeights() {
  const weights = { ...GAME_CONFIG.rarityWeights };
  const pity = gamePityState();
  const legendaryConfig = GAME_CONFIG.pity.Legendary;
  if (pity.Legendary >= legendaryConfig.forceAt) {
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

function drawRewardForMission(missionType) {
  const mission = focusMissionStatus()[missionType];
  if (!mission || !mission.canClaim) return null;
  const weights = adjustedRarityWeights();
  const rarity = chooseRarity(weights);
  const reward = chooseReward("FOCUS", rarity);
  if (!reward) return null;
  const event = normalizeGameEvents([{
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
    status: "saved",
    sourceLogId: lastSession?.id || "",
    payload: {
      reward,
      mission: {
        units: mission.units,
        target: mission.target
      },
      pity: gamePityState(),
      weights
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }])[0];
  data.gameEvents.unshift(event);
  save();
  if (typeof syncGameEventToSheet === "function") syncGameEventToSheet(event, { silent: true });
  return event;
}

function rewardUsedEventFor(instanceId) {
  return (data.gameEvents || []).find(event => event.eventType === "reward_used" && event.rewardInstanceId === instanceId);
}

function rewardInventoryItems() {
  const groups = new Map();
  gameDrawEvents().forEach(event => {
    if (rewardUsedEventFor(event.rewardInstanceId)) return;
    const key = event.rewardId;
    const current = groups.get(key) || {
      rewardId: event.rewardId,
      rewardName: event.rewardName,
      rewardType: event.rewardType,
      rarity: event.rarity,
      icon: event.payload?.reward?.icon || "",
      count: 0,
      instances: []
    };
    current.count += 1;
    current.instances.push(event);
    groups.set(key, current);
  });
  return Array.from(groups.values()).sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity) || a.rewardName.localeCompare(b.rewardName));
}

function useRewardInstance(instanceId) {
  const rewardEvent = gameDrawEvents().find(event => event.rewardInstanceId === instanceId);
  if (!rewardEvent || rewardUsedEventFor(instanceId)) return null;
  const event = normalizeGameEvents([{
    id: newId("GE"),
    eventType: "reward_used",
    skillId: rewardEvent.skillId,
    missionType: rewardEvent.missionType,
    missionKey: rewardEvent.missionKey,
    rewardInstanceId: instanceId,
    rewardId: rewardEvent.rewardId,
    rewardName: rewardEvent.rewardName,
    rewardType: rewardEvent.rewardType,
    rarity: rewardEvent.rarity,
    status: "used",
    sourceLogId: rewardEvent.sourceLogId || "",
    payload: { usedFromEventId: rewardEvent.id },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }])[0];
  data.gameEvents.unshift(event);
  save();
  if (typeof syncGameEventToSheet === "function") syncGameEventToSheet(event, { silent: true });
  if (typeof renderAll === "function") renderAll();
  return event;
}

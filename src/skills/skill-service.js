// src/skills/skill-service.js
// Computes active character attributes without mutating legacy skill history.

function activeSkillConfigById(id) {
  return ACTIVE_SKILL_CONFIG.find(skill => skill.id === id);
}

function ensureActiveSkillSelection() {
  if (!ACTIVE_SKILL_IDS.includes(selectedSkillId)) selectedSkillId = "focus";
}

function activeSkillStates() {
  return ACTIVE_SKILL_CONFIG.map(config => buildActiveSkillState(config));
}

function activeSkillStateById(id) {
  return buildActiveSkillState(activeSkillConfigById(id) || ACTIVE_SKILL_CONFIG[0]);
}

function buildActiveSkillState(config) {
  const lifetimeProgress = activeSkillLifetimeProgress(config);
  const annualProgress = activeSkillAnnualProgress(config);
  const levelState = activeSkillLevelState(config, lifetimeProgress);
  return {
    ...config,
    ...levelState,
    lifetimeProgress,
    annualProgress,
    annualProgressPct: config.annualTarget ? Math.min(100, Math.round((annualProgress / config.annualTarget) * 100)) : null,
    longTermProgressPct: config.target2030 ? Math.min(100, Math.round((lifetimeProgress / config.target2030) * 100)) : null,
    milestoneStates: activeSkillMilestoneStates(config, lifetimeProgress),
    achievementStates: activeSkillAchievementStates(config, lifetimeProgress),
    recentActivity: activeSkillRecentActivity(config)
  };
}

function activeSkillLifetimeProgress(config) {
  if (config.source === "completed_20min_session") return completedFocusProgress(data.logs || []);
  return 0;
}

function activeSkillAnnualProgress(config, year = new Date().getFullYear()) {
  if (config.source !== "completed_20min_session") return 0;
  const logs = (data.logs || []).filter(log => {
    const parsed = parseLogDate(log.date);
    return parsed && parsed.getFullYear() === year;
  });
  return completedFocusProgress(logs);
}

function completedFocusProgress(logs = []) {
  const unitMinutes = GAME_CONFIG?.skills?.FOCUS?.unitMinutes || 20;
  return logs.reduce((sum, log) => sum + Math.floor(Math.max(0, Number(log.minutes || 0)) / unitMinutes), 0);
}

function activeSkillLevelState(config, lifetimeProgress) {
  if (!config.levelStep) {
    return {
      level: 1,
      title: config.baseTitle,
      currentLevelStart: 0,
      nextLevelAt: null,
      progressToNext: null
    };
  }
  const level = Math.max(1, Math.floor(lifetimeProgress / config.levelStep) + 1);
  const currentLevelStart = (level - 1) * config.levelStep;
  const nextLevelAt = level * config.levelStep;
  const progressToNext = Math.min(100, Math.round(((lifetimeProgress - currentLevelStart) / config.levelStep) * 100));
  return {
    level,
    title: activeSkillTitle(config, level),
    currentLevelStart,
    nextLevelAt,
    progressToNext
  };
}

function activeSkillTitle(config, level) {
  return [...(config.titles || [])]
    .sort((a, b) => b.minLevel - a.minLevel)
    .find(item => level >= item.minLevel)?.title || config.baseTitle;
}

function activeSkillMilestoneStates(config, lifetimeProgress) {
  return (config.milestones || []).map(item => ({
    ...item,
    completed: Number.isFinite(Number(item.target)) && lifetimeProgress >= Number(item.target)
  }));
}

function activeSkillAchievementStates(config, lifetimeProgress) {
  return (config.achievements || []).map(item => ({
    ...item,
    unlocked: Number.isFinite(Number(item.target)) && lifetimeProgress >= Number(item.target)
  }));
}

function activeSkillRecentActivity(config, limit = 5) {
  if (config.source !== "completed_20min_session") return [];
  return [...(data.logs || [])]
    .filter(log => completedFocusProgress([log]) > 0)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, limit)
    .map(log => ({
      id: log.id,
      date: log.date,
      title: log.whatDone || taskById(log.actual_task_id || log.taskId)?.name || "20 分钟专注",
      progress: completedFocusProgress([log])
    }));
}

function activeSkillLegacyArchive(config) {
  return (config.legacySkillIds || [])
    .map(id => (data.legacySkills || data.skills || []).find(skill => skill.id === id))
    .filter(Boolean);
}

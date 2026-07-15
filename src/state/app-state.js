/* defaultSheetSyncConfig moved to APP_CONFIG */
let data = null;
let selectedCampaignId = "Q-001";
let selectedQuestId = "Q-009";
let selectedTaskId = "T-003";
let selectedGoalId = "BUSINESS";
let selectedSkillId = "focus";
let editingLogId = null;
let lastSession = null;
let seconds = APP_CONFIG.SESSION_DURATION_SECONDS;
let timerTaskId = selectedTaskId;
let timer = null;
let timerEndsAt = 0;
let running = false;
let timerSessionActive = false;
let pendingAfterSessionSave = null;
let selectedPivotType = "renamed";
let todoUiState = { category: "DFK", filter: "ALL", isStarred: false, isUrgent: false };
let reviewWeeksAgo = 0;
let currentSessionWorthRecording = false;
let pendingRewardClaim = null;
const MINDSET_CANONICAL_QUEST_ID = "Q-004";
const MINDSET_CANONICAL_TASK_ID = "T-007";
const MINDSET_MERGED_QUEST_IDS = ["Q-028", "Q-029", "Q-030", "Q-031", "Q-032", "Q-033", "Q-034", "Q-035", "Q-036", "Q-037"];
const MINDSET_MERGED_TASK_IDS = ["T-033", "T-034", "T-035", "T-036", "T-037", "T-038", "T-039", "T-040"];
const DFK_LEGACY_QUEST_MAP = { "Q-018": "Q-009", "Q-019": "Q-010" };
const weeklyCommandFocus = [
  { id: "dfk-finance-rules", label: "W1", title: "DFK 核对财务和制定制度", questId: "Q-010", taskId: "T-002" },
  { id: "inso-development-system", label: "W2", title: "INSO 快速开发系统", questId: "Q-012", taskId: "T-016" }
];

const $ = (id) => document.getElementById(id);
const questById = (id) => data.quests.find(q => q.id === id);
const taskById = (id) => data.tasks.find(t => t.id === id);
const skillById = (id) => (data.legacySkills || data.skills || []).find(s => s.id === id);
const tasksForQuest = (id) => data.tasks.filter(t => t.questId === id);
const pct = (n) => Math.round(n) + "%";
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const goalLabel = (goal) => goal?.displayTitle || goal?.id || "";

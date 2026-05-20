/* defaultSheetSyncConfig moved to APP_CONFIG */
let data = null;
let selectedCampaignId = "Q-001";
let selectedQuestId = "Q-009";
let selectedTaskId = "T-003";
let selectedGoalId = "BUSINESS";
let selectedSkillId = "personal-system";
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
const weeklyCommandFocus = [
  { id: "dfk-finance", label: "G1", title: "DFK 财务系统", questId: "Q-010", taskId: "T-002", note: "本周先把 DFK 财务流程和费用判断稳定下来。" },
  { id: "inso-customer", label: "G2", title: "INSO 客户联系提醒管理系统", questId: "Q-013", taskId: "T-018", note: "本周先把客户联系、提醒和维护动作固定下来。" }
];

const $ = (id) => document.getElementById(id);
const questById = (id) => data.quests.find(q => q.id === id);
const taskById = (id) => data.tasks.find(t => t.id === id);
const skillById = (id) => data.skills.find(s => s.id === id);
const tasksForQuest = (id) => data.tasks.filter(t => t.questId === id);
const pct = (n) => Math.round(n) + "%";
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const goalLabel = (goal) => goal?.displayTitle || goal?.id || "";

// src/config/app-config.js
// Central config for Plan RPG.
// Change values here only. Do not put business logic here.

const APP_CONFIG = {
  VERSION: "0.3.62",
  STORAGE_KEY: "plan-rpg-local-mvp-v2",
  LEGACY_KEY: "plan-rpg-local-mvp-v1",
  SHEET_SYNC_CONFIG_KEY: "plan-rpg-sheet-sync-config-v1",
  SESSION_DURATION_SECONDS: 1200,
  PENDING_SYNC_KEY: "plan-rpg-sheet-sync-pending-v1",
  LOCAL_UNSYNCED_LOGS_KEY: "plan-rpg-local-unsynced-session-logs-v1",
  MAP_COLLAPSE_STATE_KEY: "plan-rpg-map-collapse-state-v1",
  FOCUS_DRAFT_KEY: "plan-rpg-focus-draft",
  TODO_UI_STATE_KEY: "plan-rpg-todo-ui-state-v1",
  DEFAULT_GAS_URL: "https://script.google.com/macros/s/AKfycbxdC5YaxjbtCFdgW5Viu19_LDZNm7wCBr7VxSqSOUWBloxROgLONp0GJ7omjinr9yarrw/exec",
  DEFAULT_SYNC_TOKEN: "plan-rpg-2026",
  LEGACY_GAS_URLS: [
    "https://script.google.com/macros/s/AKfycby6PAN6jVJrL7Z9QGzIdr_aaeyE8kpTjjBtWQXQMvP621P_CyfrW5R-M0gNPQQt9PHU/exec"
  ],
  LEGACY_SYNC_TOKENS: ["CHANGE_ME_PLAN_RPG_TOKEN"]
};

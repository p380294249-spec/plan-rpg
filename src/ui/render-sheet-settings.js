// src/ui/render-sheet-settings.js
// Extracted from index.html during the safe modular refactor.

function renderSheetSyncConfig(message = "") {
  const config = sheetSyncConfig();
  if ($("sheetSyncUrl")) $("sheetSyncUrl").value = config.url || "";
  if ($("sheetSyncToken")) $("sheetSyncToken").value = config.token || "";
  if ($("sheetSyncBadge")) $("sheetSyncBadge").textContent = config.url ? "已配置" : "未配置";
  if ($("sheetSyncStatus")) $("sheetSyncStatus").textContent = message || (config.url ? "打开网页会同步待办、专注记录和数据记录。" : "先部署 Apps Script，再填 URL 和 Token。");
}

// src/ui/render-sheet-settings.js
// Extracted from index.html during the safe modular refactor.

function renderSheetSyncConfig(message = "") {
  const config = sheetSyncConfig();
  if ($("sheetSyncUrl")) $("sheetSyncUrl").value = config.url || "";
  if ($("sheetSyncToken")) $("sheetSyncToken").value = config.token || "";
  if ($("sheetSyncBadge")) $("sheetSyncBadge").textContent = config.url ? "已配置" : "未配置";
  if ($("sheetSyncStatus")) $("sheetSyncStatus").textContent = message || (config.url ? "打开网页会自动读取，完成专注会自动写入 Session_Logs。" : "先部署 Apps Script，再填 URL 和 Token。");
}

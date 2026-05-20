// src/ui/render-model.js
// Extracted from index.html during the safe modular refactor.

function renderModel() {
  $("modelTable").innerHTML = data.model.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
}

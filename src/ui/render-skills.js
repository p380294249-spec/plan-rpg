// src/ui/render-skills.js
// Extracted from index.html during the safe modular refactor.

function renderSkills() {
  $("skillList").innerHTML = data.skills.map(s => `
    <button class="skill-card ${s.id === selectedSkillId ? "active" : ""}" data-skill="${s.id}">
      <div class="row"><b>${escapeHtml(s.name)}</b><span class="pill">Lv.${s.level}</span></div>
      <div class="bar"><div class="fill" style="--value:${Math.min(100, s.xp / s.maxXp * 100)}%"></div></div>
      <small>${s.xp} / ${s.maxXp} XP</small>
    </button>
  `).join("");
  document.querySelectorAll("[data-skill]").forEach(btn => btn.onclick = () => {
    selectedSkillId = btn.dataset.skill;
    renderSkills();
  });
  const s = skillById(selectedSkillId);
  const relatedTasks = data.tasks.filter(t => (t.skillIds || []).includes(s.id));
  $("skillDetail").innerHTML = `
    <span class="pill">CEO Skill · Lv.${s.level}</span>
    <h3>${escapeHtml(s.name)}</h3>
    <p>${escapeHtml(s.description)}</p>
    <div class="progress-number"><span>技能经验</span><span>${s.xp} / ${s.maxXp}</span></div>
    <div class="bar"><div class="fill" style="--value:${Math.min(100, s.xp / s.maxXp * 100)}%"></div></div>
    <h4>LinkedIn CEO 要求映射</h4>
    <div class="skill-node-row">
      ${s.requirements.map(r => `<div class="skill-node"><b>Requirement</b><p>${escapeHtml(r)}</p></div>`).join("")}
      <div class="skill-node"><b>解锁奖励</b><p>${escapeHtml(s.unlock)}</p></div>
    </div>
    <h4>训练任务</h4>
    <div class="task-list">
      ${relatedTasks.map(t => `<button class="task-card" data-skill-task="${t.id}"><div class="task-head"><span>${escapeHtml(t.name)}</span><span class="pill">${t.gmn}</span></div><small>${escapeHtml(t.instruction)}</small></button>`).join("")}
    </div>
  `;
  document.querySelectorAll("[data-skill-task]").forEach(btn => btn.onclick = () => {
    selectedTaskId = btn.dataset.skillTask;
    selectedQuestId = taskById(selectedTaskId).questId;
    showScreen("focus");
  });
}

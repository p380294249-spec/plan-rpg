// src/ui/render-skills.js
// Active Skills are long-term RPG attributes. Legacy skills stay archived for old logs.

function renderSkills() {
  ensureActiveSkillSelection();
  const skills = activeSkillStates();
  $("skillList").innerHTML = skills.map(s => `
    <button class="skill-card ${s.id === selectedSkillId ? "active" : ""}" data-skill="${s.id}">
      <div class="row"><b>${escapeHtml(s.cnName)}</b><span class="pill">Lv.${s.level}</span></div>
      <small>${escapeHtml(s.title)}</small>
      <div class="bar"><div class="fill" style="--value:${s.progressToNext ?? 0}%"></div></div>
      <small>${activeSkillCardMeta(s)}</small>
    </button>
  `).join("");
  document.querySelectorAll("[data-skill]").forEach(btn => btn.onclick = () => {
    selectedSkillId = btn.dataset.skill;
    renderSkills();
  });
  const s = activeSkillStateById(selectedSkillId);
  const legacyArchive = activeSkillLegacyArchive(s);
  $("skillDetail").innerHTML = `
    <span class="pill">角色属性</span>
    <h3>${escapeHtml(s.cnName)}</h3>
    <p class="skill-title-line">${escapeHtml(s.title)}</p>
    <div class="active-skill-stats">
      <div class="summary-stat"><span>等级</span><b>Lv.${s.level}</b></div>
      <div class="summary-stat"><span>累计</span><b>${activeSkillProgressText(s.lifetimeProgress, s.unit)}</b></div>
      <div class="summary-stat"><span>年度</span><b>${s.annualTarget ? `${s.annualProgress} / ${s.annualTarget}` : "待设定"}</b></div>
      <div class="summary-stat"><span>2030</span><b>${s.target2030 ? `${s.lifetimeProgress} / ${s.target2030}` : "待设定"}</b></div>
    </div>
    <div class="progress-number"><span>下一等级</span><span>${activeSkillNextLevelText(s)}</span></div>
    <div class="bar"><div class="fill" style="--value:${s.progressToNext ?? 0}%"></div></div>
    <div class="skill-lore">
      <div><b>成长规则</b><p>${escapeHtml(activeSkillRuleText(s))}</p></div>
      <div><b>导师灵感</b><p>${escapeHtml(s.mentor || "待设定")}</p></div>
      <div><b>角色方向</b><p>${escapeHtml(s.inspiration || "")}</p></div>
    </div>
    <h4>重要里程碑</h4>
    <div class="skill-node-row">
      ${s.milestoneStates.map(item => `
        <div class="skill-node ${item.completed ? "done" : ""}">
          <b>${item.completed ? "已解锁" : "未解锁"}</b>
          <p>${escapeHtml(item.label)}</p>
        </div>
      `).join("")}
    </div>
    <h4>成就</h4>
    <div class="achievement-grid">
      ${activeSkillAchievementHtml(s)}
    </div>
    <h4>最近行动</h4>
    <div class="log-list compact-log-list">
      ${activeSkillRecentHtml(s)}
    </div>
    <details class="legacy-skill-archive">
      <summary>旧技能档案 (${legacyArchive.length})</summary>
      <p>旧 Skills 保留给历史日志和旧 XP，不作为新的 active character attributes 自动计入。</p>
      <div class="skill-node-row">
        ${legacyArchive.map(skill => `<div class="skill-node"><b>${escapeHtml(skill.name)}</b><p>Lv.${skill.level} · ${skill.xp} / ${skill.maxXp} XP</p></div>`).join("") || `<div class="skill-node"><b>None</b><p>这个新 Skill 暂时没有关联旧档案。</p></div>`}
      </div>
    </details>
  `;
}

function activeSkillCardMeta(skill) {
  if (skill.progressionStatus !== "active") return "成长规则待设定";
  return `${activeSkillProgressText(skill.lifetimeProgress, skill.unit)} · 下一等级 ${skill.nextLevelAt || "-"}`;
}

function activeSkillProgressText(value, unit) {
  return `${Number(value || 0)} ${escapeHtml(unit || "进度")}`;
}

function activeSkillNextLevelText(skill) {
  if (!skill.nextLevelAt) return "成长规则待设定";
  return `${skill.lifetimeProgress} / ${skill.nextLevelAt} ${escapeHtml(skill.unit)}`;
}

function activeSkillRuleText(skill) {
  if (skill.source === "completed_20min_session") return "完成 1 次 20 分钟专注，获得 1 点专注进度。";
  return "成长规则尚未设定。结构已经准备好，暂时不人为规定进度。";
}

function activeSkillAchievementHtml(skill) {
  if (!skill.achievementStates.length) {
    return `<div class="skill-node locked"><b>待设计</b><p>这个 Skill 的成就池以后再配置。</p></div>`;
  }
  return skill.achievementStates.map(item => `
    <div class="skill-node ${item.unlocked ? "done" : "locked"}">
      <b>${item.unlocked ? "已解锁" : "未解锁"}</b>
      <p><strong>${escapeHtml(item.name)}</strong><br>${escapeHtml(item.description)}</p>
    </div>
  `).join("");
}

function activeSkillRecentHtml(skill) {
  if (!skill.recentActivity.length) {
    return `<div class="log-card"><b>等待接入</b><p>${skill.progressionStatus === "active" ? "还没有完成的 20 分钟专注记录。" : "这个 Skill 还没有定义进度规则，所以暂不自动归入活动。"}</p></div>`;
  }
  return skill.recentActivity.map(item => `
    <div class="log-card">
      <div class="task-head"><b>${escapeHtml(item.title)}</b><span class="pill">+${item.progress} ${escapeHtml(skill.unit)}</span></div>
      <small>${escapeHtml(item.date)}</small>
    </div>
  `).join("");
}

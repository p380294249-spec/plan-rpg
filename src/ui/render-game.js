// src/ui/render-game.js
// UI for the modular Game Layer.

function rarityLabel(rarity) {
  return ({
    Common: "普通",
    Rare: "稀有",
    Epic: "史诗",
    Legendary: "传说"
  })[rarity] || rarity;
}

function rarityClass(rarity) {
  return `rarity-${String(rarity || "Common").toLowerCase()}`;
}

function renderGameMissionPanel() {
  if (!$("gameMissionPanel")) return;
  const missions = focusMissionStatus();
  const level = focusLevelState();
  $("gameMissionPanel").innerHTML = `
    <div class="game-command-head">
      <div>
        <span class="pill">FOCUS CORE LOOP</span>
        <h3>Daily Mission</h3>
      </div>
      <button class="secondary" data-open-game>Reward Wallet</button>
    </div>
    <div class="game-mission-grid">
      ${renderMissionCard(missions.daily)}
      ${renderMissionCard(missions.weekly)}
      <div class="game-level-card">
        <span>FOCUS Lv.${level.level}</span>
        <b>${escapeHtml(level.title)}</b>
        <div class="bar"><div class="fill" style="--value:${level.progress}%"></div></div>
        <small>${roundedFocusUnits(level.lifetimeUnits)} lifetime Focus</small>
      </div>
    </div>
  `;
  bindGameButtons();
}

function renderMissionCard(mission) {
  const title = mission.type === "daily" ? "TODAY" : "WEEK";
  const completeText = mission.claimed ? "已领取" : mission.canClaim ? "CLAIM REWARD" : `${mission.progress}%`;
  return `
    <div class="game-mission-card ${mission.complete ? "complete" : ""}">
      <div class="game-mission-top">
        <b>${title}</b>
        <span>${roundedFocusUnits(mission.units)} / ${mission.target}</span>
      </div>
      ${mission.type === "daily" ? `<div class="focus-dots">${focusDots(mission.units, mission.target)}</div>` : `<div class="bar"><div class="fill" style="--value:${mission.progress}%"></div></div>`}
      <button class="${mission.canClaim ? "primary" : "secondary"}" ${mission.canClaim ? `data-game-claim="${mission.type}"` : "disabled"}>${completeText}</button>
    </div>
  `;
}

function focusDots(units, target) {
  const filled = Math.floor(Math.min(units, target));
  return Array.from({ length: target }, (_, index) => `<span class="${index < filled ? "filled" : ""}"></span>`).join("");
}

function renderGame() {
  const missions = focusMissionStatus();
  const level = focusLevelState();
  const inventory = rewardInventoryItems();
  const history = gameDrawEvents().slice(0, 12);
  $("gameRoot").innerHTML = `
    <div class="game-hero panel">
      <div>
        <span class="pill">Game Layer</span>
        <h3>FOCUS Lv.${level.level} · ${escapeHtml(level.title)}</h3>
      </div>
      <div class="game-hero-stats">
        <div><span>Lifetime</span><b>${roundedFocusUnits(level.lifetimeUnits)}</b></div>
        <div><span>Today</span><b>${roundedFocusUnits(missions.daily.units)} / ${missions.daily.target}</b></div>
        <div><span>Week</span><b>${roundedFocusUnits(missions.weekly.units)} / ${missions.weekly.target}</b></div>
      </div>
    </div>

    <section class="panel game-section">
      <div class="game-section-head"><h3>Mission</h3><small>完成 Focus 后领取宝箱</small></div>
      <div class="game-mission-grid">
        ${renderMissionCard(missions.daily)}
        ${renderMissionCard(missions.weekly)}
      </div>
    </section>

    <section class="panel game-section">
      <div class="game-section-head"><h3>Inventory</h3><small>奖励可保存，使用后留下记录</small></div>
      <div class="inventory-grid">
        ${inventory.map(item => renderInventoryItem(item)).join("") || `<div class="game-empty">还没有奖励。先完成 5 个 Focus 领取 Daily Chest。</div>`}
      </div>
    </section>

    <section class="panel game-section">
      <div class="game-section-head"><h3>Draw History</h3><small>抽奖历史和稀有度</small></div>
      <div class="draw-history">
        ${history.map(event => `
          <div class="draw-row ${rarityClass(event.rarity)}">
            <span>${escapeHtml(event.rewardName)}</span>
            <b>${rarityLabel(event.rarity)}</b>
            <small>${gameDateKey(gameEventDate(event))}</small>
          </div>
        `).join("") || `<div class="game-empty">暂无抽奖记录。</div>`}
      </div>
    </section>

    <section class="panel game-section">
      <div class="game-section-head"><h3>Reward Pool</h3><small>配置驱动，后续直接往池子里加</small></div>
      <div class="reward-pool-grid">
        ${GAME_CONFIG.rewardPools.FOCUS.map(reward => `
          <div class="pool-card ${rarityClass(reward.rarity)}">
            <span>${escapeHtml(reward.icon || "✦")}</span>
            <b>${escapeHtml(reward.name)}</b>
            <small>${rarityLabel(reward.rarity)} · ${escapeHtml(reward.type)}</small>
          </div>
        `).join("")}
      </div>
    </section>
  `;
  bindGameButtons();
}

function renderInventoryItem(item) {
  const firstInstance = item.instances[0];
  return `
    <div class="inventory-card ${rarityClass(item.rarity)}">
      <div class="inventory-icon">${escapeHtml(item.icon || "✦")}</div>
      <div>
        <b>${escapeHtml(item.rewardName)} × ${item.count}</b>
        <small>${rarityLabel(item.rarity)} · ${escapeHtml(item.rewardType)} · SAVE</small>
      </div>
      <button class="secondary" data-use-reward="${escapeHtml(firstInstance.rewardInstanceId)}">USE</button>
    </div>
  `;
}

function bindGameButtons() {
  document.querySelectorAll("[data-game-claim]").forEach(btn => {
    btn.onclick = () => startRewardClaim(btn.dataset.gameClaim);
  });
  document.querySelectorAll("[data-open-game]").forEach(btn => {
    btn.onclick = () => {
      closeModal("rewardModal");
      showScreen("game");
    };
  });
  document.querySelectorAll("[data-use-reward]").forEach(btn => {
    btn.onclick = () => {
      useRewardInstance(btn.dataset.useReward);
      renderGame();
    };
  });
}

function startRewardClaim(missionType) {
  const mission = focusMissionStatus()[missionType];
  if (!mission?.canClaim) return;
  pendingRewardClaim = missionType;
  renderRewardModal("ready");
}

function renderRewardModal(mode, event = null) {
  const modal = $("rewardModal");
  if (!modal) return;
  modal.classList.remove("hide");
  const rarity = event?.rarity || "Common";
  $("rewardModalContent").innerHTML = mode === "ready" ? `
    <div class="reward-reveal ready">
      <span class="pill">MISSION COMPLETE</span>
      <div class="chest-visual">CHEST</div>
      <h3>${pendingRewardClaim === "weekly" ? "Weekly Reward Chest" : "Daily Reward Chest"}</h3>
      <button class="primary" id="openRewardChestBtn">OPEN CHEST</button>
    </div>
  ` : `
    <div class="reward-reveal revealed ${rarityClass(rarity)}">
      <span class="pill">${rarityLabel(rarity)} REWARD</span>
      <div class="chest-visual">${escapeHtml(event.payload?.reward?.icon || "✦")}</div>
      <h3>${escapeHtml(event.rewardName)}</h3>
      <p>${escapeHtml(event.rewardType)} · 已加入 Inventory</p>
      <div class="actions">
        <button class="primary" data-open-game>查看奖励库</button>
        <button class="secondary" data-close-modal="rewardModal">继续行动</button>
      </div>
    </div>
  `;
  if ($("openRewardChestBtn")) $("openRewardChestBtn").onclick = openPendingRewardChest;
  modal.querySelectorAll("[data-close-modal]").forEach(btn => btn.onclick = () => closeModal(btn.dataset.closeModal));
  bindGameButtons();
}

function openPendingRewardChest() {
  if (!pendingRewardClaim) return;
  const event = drawRewardForMission(pendingRewardClaim);
  pendingRewardClaim = null;
  if (!event) return;
  renderAll();
  renderRewardModal("revealed", event);
}

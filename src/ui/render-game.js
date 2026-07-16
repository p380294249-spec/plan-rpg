// src/ui/render-game.js
// Reward UI: mission claim, concealed draw, and two-step reward redemption.

function rarityLabel(rarity) {
  return ({ Common: "普通", Rare: "稀有", Epic: "史诗", Legendary: "传说" })[rarity] || rarity;
}

function rarityClass(rarity) {
  return `rarity-${String(rarity || "Common").toLowerCase()}`;
}

function rewardStatusLabel(status) {
  return ({ unredeemed: "待兑现", redeeming: "兑现中", completed: "已完成", expired: "已过期" })[status] || status;
}

function rewardCountdownText(milliseconds) {
  if (milliseconds <= 0) return "已过期";
  const days = Math.floor(milliseconds / 86400000);
  const hours = Math.floor((milliseconds % 86400000) / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分`;
  return `${Math.max(1, minutes)}分钟`;
}

function rewardTimerText(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds || 0)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function clearRewardRevealTimers() {
  rewardRevealTimers.forEach(timerId => clearTimeout(timerId));
  rewardRevealTimers = [];
}

function syncRewardClock(instances) {
  const needsClock = instances.some(item => item.status === "redeeming" && item.redemptionType === "time" && rewardTimeRemainingSeconds(item) > 0);
  if (needsClock && !rewardClockTimer) {
    rewardClockTimer = setInterval(() => {
      if ($("game")?.classList.contains("active")) renderGame();
    }, 1000);
  }
  if (!needsClock && rewardClockTimer) {
    clearInterval(rewardClockTimer);
    rewardClockTimer = null;
  }
}

function streakText(streak) {
  if (!streak.current) return streak.activeToday ? "今天开始" : "还没开始，去专注一次吧";
  return `连续 ${streak.current} 天${streak.activeToday ? "" : "（今天还没打卡）"}`;
}

function renderGameMissionPanel() {
  if (!$("gameMissionPanel")) return;
  const missions = focusMissionStatus();
  const level = focusLevelState();
  const streak = focusStreakState();
  $("gameMissionPanel").innerHTML = `
    <div class="game-command-head">
      <div>
        <span class="pill">专注成长</span>
        <h3>今日挑战</h3>
      </div>
      <div class="streak-badge ${streak.current ? "active" : ""}" title="最高连续 ${streak.best} 天">🔥 ${streakText(streak)}</div>
      <button class="secondary" data-open-game>奖励仓库</button>
    </div>
    <div class="game-mission-grid">
      ${renderMissionCard(missions.daily)}
      ${renderMissionCard(missions.weekly)}
      <div class="game-level-card">
        <span>专注力 Lv.${level.level}</span>
        <b>${escapeHtml(level.title)}</b>
        <div class="bar"><div class="fill" style="--value:${level.progress}%"></div></div>
        <small>${roundedFocusUnits(level.lifetimeUnits)} lifetime Focus</small>
      </div>
    </div>
  `;
  bindGameButtons();
}

function renderMissionCard(mission) {
  const title = mission.type === "daily" ? "今日" : "本周";
  const completeText = mission.claimed ? "已领取" : mission.canClaim ? "领取宝箱" : `${mission.progress}%`;
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
  scanExpiredRewardInstances();
  const now = Date.now();
  const missions = focusMissionStatus();
  const level = focusLevelState();
  const inventory = rewardInventoryInstances(now);
  const history = allRewardInstances(now).sort((left, right) => gameEventTimestamp(right.drawEvent) - gameEventTimestamp(left.drawEvent));
  const stats = rewardRedemptionStats(now);
  const streak = focusStreakState();
  syncRewardClock(inventory);
  $("gameRoot").innerHTML = `
    <div class="game-hero panel">
      <div class="game-hero-row">
        <div>
          <span class="pill">专注冒险</span>
          <h3>专注力 Lv.${level.level} · ${escapeHtml(level.title)}</h3>
        </div>
        <div class="game-hero-stats">
          <div><span>累计专注</span><b>${roundedFocusUnits(level.lifetimeUnits)}</b></div>
          <div><span>今日</span><b>${roundedFocusUnits(missions.daily.units)} / ${missions.daily.target}</b></div>
          <div><span>本周</span><b>${roundedFocusUnits(missions.weekly.units)} / ${missions.weekly.target}</b></div>
          <div><span>连续打卡</span><b>🔥 ${streak.current} 天</b></div>
        </div>
      </div>
      <small class="streak-best">历史最高连续 ${streak.best} 天${streak.current && !streak.activeToday ? " · 今天还没打卡，别断掉" : ""}</small>
    </div>

    <section class="panel game-section">
      <div class="game-section-head"><h3>挑战任务</h3><small>完成专注后领取宝箱</small></div>
      <div class="game-mission-grid">
        ${renderMissionCard(missions.daily)}
        ${renderMissionCard(missions.weekly)}
      </div>
    </section>

    <section class="panel game-section">
      <div class="game-section-head"><h3>奖励仓库</h3><small>开始兑现后，才会进入完成步骤</small></div>
      <div class="reward-wallet-grid">
        ${inventory.map(item => renderRewardWalletCard(item, now)).join("") || `<div class="game-empty">还没有待兑现奖励。先完成 5 个 Focus 领取 Daily Chest。</div>`}
      </div>
    </section>

    <section class="panel game-section">
      <div class="game-section-head"><h3>奖励历史</h3><small>已到期奖励的兑现率</small></div>
      <div class="reward-history-stats ${stats.warning ? "warning" : ""}">
        <div><span>已发放</span><b>${stats.issued}</b></div>
        <div><span>已完成</span><b>${stats.completed}</b></div>
        <div><span>已过期</span><b>${stats.expired}</b></div>
        <div><span>兑现率</span><b>${stats.rate === null ? "-" : `${stats.rate}%`}</b></div>
      </div>
      ${stats.warning ? `<div class="reward-rate-warning">兑现率低于 60%，先使用已获得的奖励，再继续抽新的。</div>` : ""}
      <div class="draw-history">
        ${history.map(item => renderRewardHistoryRow(item)).join("") || `<div class="game-empty">暂无抽奖记录。</div>`}
      </div>
    </section>

    <section class="panel game-section">
      <div class="game-section-head"><h3>奖励池</h3><small>奖励和概率都在配置层，可随时调整</small></div>
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

function renderRewardWalletCard(item, now) {
  const remainingMs = item.expiresAt - now;
  const urgent = item.status === "unredeemed" && remainingMs > 0 && remainingMs < rewardFlowConfig().urgentExpiryHours * 3600000;
  const remainingSeconds = rewardTimeRemainingSeconds(item, now);
  const isTime = item.redemptionType === "time";
  const note = rewardRedemptionNotes[item.id] ?? item.note ?? "";
  const action = item.status === "unredeemed"
    ? `<button class="primary" data-start-redeem="${escapeHtml(item.id)}">开始兑现</button>`
    : isTime && remainingSeconds > 0
      ? `<span class="reward-timer">${rewardTimerText(remainingSeconds)}</span>`
      : `<button class="primary reward-complete" data-complete-redeem="${escapeHtml(item.id)}">完成</button>`;
  return `
    <article class="reward-wallet-card ${rarityClass(item.rarity)} ${urgent ? "expiring" : ""} ${item.status}">
      <div class="reward-wallet-main">
        <div class="inventory-icon">${escapeHtml(item.icon)}</div>
        <div>
          <div class="reward-title-row"><span class="rarity-chip">${rarityLabel(item.rarity)}</span><b>${escapeHtml(item.rewardName)}</b></div>
          <small>${item.status === "unredeemed" ? `剩余 ${rewardCountdownText(remainingMs)}` : isTime && remainingSeconds > 0 ? "奖励时间进行中" : rewardStatusLabel(item.status)}</small>
        </div>
      </div>
      <div class="reward-wallet-action">${action}</div>
      ${item.status === "redeeming" && item.redemptionType === "consumption" ? `<label class="reward-note-label">花在哪了？<input data-reward-note="${escapeHtml(item.id)}" value="${escapeHtml(note)}" placeholder="可选" /></label>` : ""}
    </article>
  `;
}

function renderRewardHistoryRow(item) {
  const detail = item.note ? ` · ${escapeHtml(item.note)}` : "";
  return `
    <div class="draw-row ${rarityClass(item.rarity)}">
      <span>${escapeHtml(item.rewardName)}</span>
      <b>${rarityLabel(item.rarity)}</b>
      <small>${rewardStatusLabel(item.status)}${detail}</small>
      <small>${gameDateKey(gameEventDate(item.drawEvent))}</small>
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
  document.querySelectorAll("[data-start-redeem]").forEach(btn => {
    btn.onclick = () => {
      startRewardRedemption(btn.dataset.startRedeem);
      renderGame();
    };
  });
  document.querySelectorAll("[data-complete-redeem]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.completeRedeem;
      const completed = completeRewardRedemption(id, rewardRedemptionNotes[id] || "");
      if (completed) delete rewardRedemptionNotes[id];
      renderGame();
    };
  });
  document.querySelectorAll("[data-reward-note]").forEach(input => {
    input.oninput = () => { rewardRedemptionNotes[input.dataset.rewardNote] = input.value; };
  });
}

function startRewardClaim(missionType) {
  const mission = focusMissionStatus()[missionType];
  if (!mission?.canClaim) return;
  clearRewardRevealTimers();
  pendingRewardClaim = missionType;
  pendingRewardDraw = null;
  renderRewardModal("ready");
}

function renderRewardModal(mode, event = null) {
  const modal = $("rewardModal");
  if (!modal) return;
  modal.classList.remove("hide");
  const rarity = event?.rarity || "Common";
  const reward = event?.payload?.reward || {};
  const missionLabel = event?.missionType === "weekly" || pendingRewardClaim === "weekly" ? "本周奖励宝箱" : "今日奖励宝箱";
  if (mode === "ready") {
    $("rewardModalContent").innerHTML = `
      <div class="reward-reveal ready">
        <span class="pill">挑战完成</span>
        <div class="chest-visual">CHEST</div>
        <h3>${missionLabel}</h3>
        <button class="primary" id="openRewardChestBtn">打开宝箱</button>
        <button class="secondary" data-close-modal="rewardModal">稍后领取</button>
      </div>
    `;
  } else if (mode === "charging") {
    $("rewardModalContent").innerHTML = `
      <div class="reward-reveal charging">
        <span class="pill">奖励已经锁定</span>
        <div class="reward-charge-aura"></div>
        <div class="chest-visual">CHEST</div>
        <h3>正在开启</h3>
      </div>
    `;
  } else if (mode === "burst") {
    $("rewardModalContent").innerHTML = `
      <div class="reward-reveal burst ${rarityClass(rarity)} ${rarity === "Legendary" ? "legendary-burst" : ""}" style="--burst-duration:${rewardFlowConfig().burstMs[rarity]}ms">
        <div class="reward-burst-aura"></div>
        ${rarity === "Legendary" ? `<div class="reward-gold-rays"></div>` : ""}
        <div class="chest-visual">${rarity === "Legendary" ? "✦" : "CHEST"}</div>
        <h3>开启中</h3>
      </div>
    `;
  } else {
    $("rewardModalContent").innerHTML = `
      <div class="reward-reveal revealed ${rarityClass(rarity)}">
        <span class="pill">${rarityLabel(rarity)}奖励</span>
        <div class="chest-visual">${escapeHtml(reward.icon || "✦")}</div>
        <h3>${escapeHtml(event.rewardName)}</h3>
        <p>已加入奖励仓库</p>
        ${event.payload?.pityTriggered ? `<small class="pity-triggered">✦ 15 次保底触发</small>` : ""}
        <div class="actions">
          <button class="primary" data-open-game>查看奖励仓库</button>
          <button class="secondary" data-close-modal="rewardModal">继续行动</button>
        </div>
      </div>
    `;
  }
  if ($("openRewardChestBtn")) $("openRewardChestBtn").onclick = openPendingRewardChest;
  modal.querySelectorAll("[data-close-modal]").forEach(btn => btn.onclick = () => closeModal(btn.dataset.closeModal));
  bindGameButtons();
}

function openPendingRewardChest() {
  if (!pendingRewardClaim || pendingRewardDraw) return;
  const event = prepareRewardDraw(pendingRewardClaim);
  if (!event) return;
  pendingRewardDraw = event;
  renderRewardModal("charging", event);
  const chargeMs = rewardFlowConfig().chargeMs;
  const burstMs = rewardFlowConfig().burstMs[event.rarity];
  rewardRevealTimers = [
    setTimeout(() => renderRewardModal("burst", event), chargeMs),
    setTimeout(() => {
      const committed = commitRewardDraw(event);
      if (!committed) return;
      pendingRewardClaim = null;
      pendingRewardDraw = null;
      renderAll();
      renderRewardModal("revealed", committed);
    }, chargeMs + burstMs)
  ];
}

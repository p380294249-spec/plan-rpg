// src/game/game-config.js
// Config-only game layer. Add rewards or tune probability here first.

const GAME_RARITIES = ["Common", "Rare", "Epic", "Legendary"];

const GAME_CONFIG = {
  skills: {
    FOCUS: {
      label: "FOCUS",
      unitMinutes: 20,
      dailyTarget: 5,
      weeklyTarget: 30,
      levelStep: 25,
      titles: [
        { minLevel: 1, title: "Starter" },
        { minLevel: 5, title: "Deep Worker" },
        { minLevel: 10, title: "Focus Knight" },
        { minLevel: 20, title: "Time Alchemist" }
      ]
    }
  },
  rarityWeights: {
    Common: 65,
    Rare: 25,
    Epic: 8,
    Legendary: 2
  },
  rewardFlow: {
    // The reward is decided immediately, but this first phase never reveals its rarity.
    chargeMs: 2000,
    burstMs: {
      Common: 600,
      Rare: 1400,
      Epic: 1800,
      Legendary: 2600
    },
    expiryDays: {
      Common: 3,
      Rare: 7,
      Epic: 14,
      Legendary: 30
    },
    urgentExpiryHours: 24
  },
  pity: {
    Epic: {
      startsAfter: 6,
      increment: 2,
      maxBonus: 14
    },
    Legendary: {
      startsAfter: 10,
      increment: 1.5,
      maxBonus: 10,
      forceAt: 15
    }
  },
  rewardPools: {
    FOCUS: [
      {
        id: "gaming-20",
        name: "20分钟游戏",
        type: "Time Reward",
        redemptionType: "time",
        durationMinutes: 20,
        rarity: "Common",
        value: 20,
        unit: "min",
        icon: "🎮"
      },
      {
        id: "coffee-fund",
        name: "手冲咖啡 / 咖啡基金",
        type: "Consumption Reward",
        redemptionType: "consumption",
        rarity: "Rare",
        value: 1,
        unit: "次",
        icon: "☕"
      },
      {
        id: "night-off",
        name: "一晚上完全不工作",
        type: "Freedom Reward",
        redemptionType: "simple",
        rarity: "Epic",
        value: 1,
        unit: "晚",
        icon: "🌙"
      },
      {
        id: "double-reward-ticket",
        name: "Double Reward 抽奖券",
        type: "Game Item",
        redemptionType: "simple",
        rarity: "Legendary",
        value: 1,
        unit: "张",
        icon: "✦"
      }
    ]
  }
};

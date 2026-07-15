// src/skills/skill-config.js
// Active long-term character attributes. Legacy data.skills remains archived for historical logs.

const ACTIVE_SKILL_CONFIG = [
  {
    id: "focus",
    name: "Focus",
    cnName: "专注",
    unit: "Focus",
    source: "completed_20min_session",
    progressionStatus: "active",
    levelStep: 25,
    annualTarget: 1560,
    target2030: null,
    baseTitle: "Focus Initiate / 专注学徒",
    mentor: "Cal Newport / Deep Work, James Clear / Atomic Habits",
    inspiration: "把注意力训练成最稳定的底层能力。",
    titles: [
      { minLevel: 1, title: "Focus Initiate / 专注学徒" },
      { minLevel: 3, title: "Deep Work Builder / 深度工作建造者" },
      { minLevel: 5, title: "Attention Commander / 注意力指挥官" },
      { minLevel: 10, title: "Time Alchemist / 时间炼成者" }
    ],
    milestones: [
      { target: 1, label: "完成第一次 20 分钟专注" },
      { target: 5, label: "单日 5 Focus 能力成型" },
      { target: 30, label: "一周 30 Focus 作战完成" },
      { target: 100, label: "累计 100 Focus" },
      { target: 300, label: "累计 300 Focus" },
      { target: 1000, label: "累计 1000 Focus" }
    ],
    achievements: [
      { id: "focus-first", target: 1, name: "First Focus", description: "完成第一段 20 分钟专注。" },
      { id: "focus-weekly", target: 30, name: "Weekly Operator", description: "累计达到一次周目标的 Focus 数。" },
      { id: "focus-hundred", target: 100, name: "Hundred Focus", description: "把专注做成稳定资产。" }
    ]
  },
  {
    id: "sales",
    name: "Sales",
    cnName: "销售",
    unit: "Progress",
    source: "pending_rule",
    progressionStatus: "planned",
    levelStep: null,
    annualTarget: null,
    target2030: null,
    baseTitle: "Pipeline Builder / 管道建立者",
    mentor: "To be configured",
    inspiration: "未来接入 CRM 结果：客户、RFQ、报价、订单、利润。",
    legacySkillIds: ["revenue", "market"],
    milestones: [
      { target: null, label: "定义 Sales Progress 规则" },
      { target: null, label: "接入客户开发与订单结果" },
      { target: null, label: "形成可复盘的销售漏斗" }
    ],
    achievements: []
  },
  {
    id: "communication",
    name: "Communication",
    cnName: "沟通",
    unit: "Progress",
    source: "pending_rule",
    progressionStatus: "planned",
    levelStep: null,
    annualTarget: null,
    target2030: null,
    baseTitle: "Clear Messenger / 清晰表达者",
    mentor: "To be configured",
    inspiration: "未来接入客户沟通、表达、谈判、写作和关系维护。",
    legacySkillIds: ["communication"],
    milestones: [
      { target: null, label: "定义沟通训练规则" },
      { target: null, label: "接入客户与团队沟通记录" },
      { target: null, label: "沉淀高质量表达模板" }
    ],
    achievements: []
  },
  {
    id: "language",
    name: "Language",
    cnName: "语言",
    unit: "Progress",
    source: "pending_rule",
    progressionStatus: "planned",
    levelStep: null,
    annualTarget: null,
    target2030: null,
    baseTitle: "Language Trainee / 语言训练者",
    mentor: "To be configured",
    inspiration: "未来接入英语、商务表达、邮件和口语训练。",
    legacySkillIds: [],
    milestones: [
      { target: null, label: "定义语言训练输入与输出" },
      { target: null, label: "接入邮件/口语/阅读训练" },
      { target: null, label: "形成商务语言能力线" }
    ],
    achievements: []
  },
  {
    id: "management",
    name: "Management",
    cnName: "管理",
    unit: "Progress",
    source: "pending_rule",
    progressionStatus: "planned",
    levelStep: null,
    annualTarget: null,
    target2030: null,
    baseTitle: "Operator / 管理执行者",
    mentor: "To be configured",
    inspiration: "未来接入制度、人员、流程、责任和复盘。",
    legacySkillIds: ["leadership", "operations", "strategy"],
    milestones: [
      { target: null, label: "定义管理能力规则" },
      { target: null, label: "接入公司制度和人员管理动作" },
      { target: null, label: "形成可复制的运营管理系统" }
    ],
    achievements: []
  },
  {
    id: "investment",
    name: "Investment",
    cnName: "投资",
    unit: "Progress",
    source: "pending_rule",
    progressionStatus: "planned",
    levelStep: null,
    annualTarget: null,
    target2030: null,
    baseTitle: "Capital Learner / 资本学习者",
    mentor: "To be configured",
    inspiration: "未来接入财务、现金流、资产配置、投资判断。",
    legacySkillIds: ["finance"],
    milestones: [
      { target: null, label: "定义 Investment Progress 规则" },
      { target: null, label: "接入财务与现金流记录" },
      { target: null, label: "形成投资判断复盘库" }
    ],
    achievements: []
  },
  {
    id: "ai-systems",
    name: "AI & Systems",
    cnName: "AI 与系统",
    unit: "Progress",
    source: "pending_rule",
    progressionStatus: "planned",
    levelStep: null,
    annualTarget: null,
    target2030: null,
    baseTitle: "System Builder / 系统搭建者",
    mentor: "To be configured",
    inspiration: "未来接入自动化、脚本、MVP、工作流和系统建设。",
    legacySkillIds: ["personal-system", "operations", "strategy"],
    milestones: [
      { target: null, label: "定义 AI & Systems Progress 规则" },
      { target: null, label: "接入自动化 MVP 与优化记录" },
      { target: null, label: "形成可销售的系统案例" }
    ],
    achievements: []
  }
];

const ACTIVE_SKILL_IDS = ACTIVE_SKILL_CONFIG.map(skill => skill.id);

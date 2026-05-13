# Plan RPG Version Notes

## v0.2.1 - 2026-05-10

### Goal

Package the local web app so it can be copied to another computer, managed with GitHub, updated with one click, and backed up safely.

### Main Changes

- Added in-app data migration controls:
  - `导出数据`: exports browser localStorage app data as JSON.
  - `导入数据`: imports a previous JSON backup.
- Added project scripts:
  - `open_plan_rpg.cmd`: one-click open.
  - `update_from_github.cmd`: one-click `git pull --ff-only`, then open.
  - `backup_project.cmd`: one-click project file backup to `backups/`.
- Added project docs:
  - `README.md`: usage, GitHub flow, backup notes, handoff rules.
  - `.gitignore`: ignores local backup artifacts.

### Important Note

GitHub stores the app code, not browser localStorage. Personal logs and skill XP must be backed up through the in-app `导出数据` button before moving to another computer.

## v0.2.0 - 2026-05-10

### Goal

Turn the first static MVP into a local web software prototype with a clearer game loop:

`Map -> Task Detail -> 20min Focus -> Session Log -> Settlement -> Weekly Review -> Skill XP`

### Files

- `index.html`: single-file local web app. Open directly in a browser.
- `VERSION.md`: handoff notes for future AI coding sessions.

### Main Changes

- Added visible app version badge: `v0.2 本地网页软件`.
- Reworked `20分钟专注` page:
  - Added `返回地图`.
  - Added `保存草稿`.
  - Changed save flow to `完成并结算`.
  - Added a right-side `Session 结算` panel.
  - Settlement shows task, focused minutes, GMN, quest progress, what was written, problem, and next step.
- Added editable local logs:
  - Review page now shows logs as cards instead of a table-only view.
  - Each log supports `查看/修改`.
  - Each log supports `删除`.
  - Edit form can change GMN, task, content, problem, solution, good, bad, and next step.
- Added CEO skill system:
  - New nav item: `CEO 技能树`.
  - Skills are derived from CEO / Founder / GM job requirement patterns.
  - Tasks map to one or more skills through `skillIds`.
  - Completing a session creates `skillXp` events.
  - Skills level up when XP reaches `maxXp`.

### Current Data Model

- `Goal2030`
- `Quest`
- `Task`
- `Session Log`
- `Skill`
- `SkillXPEvent`
- `Review`

### Local Storage

- Current storage key: `plan-rpg-local-mvp-v2`
- Previous storage key: `plan-rpg-local-mvp-v1`
- v0.2 attempts to migrate old v0.1 logs into the new seed structure.

### CEO Skill Categories

- `Strategy / 战略判断`
- `Revenue / 增长与销售`
- `Finance / 财务与资本`
- `Operations / 运营系统`
- `Leadership / 团队领导`
- `Communication / 影响力表达`
- `Market Insight / 市场洞察`
- `Personal System / 自我系统`

### Requirement Source Notes

The CEO skills were summarized from common LinkedIn CEO / Founder / GM role requirements:

- Long-term strategy and measurable operating plans
- Revenue generation, GTM, sales playbooks
- Financial planning, fundraising, capital allocation
- Scalable operating model, KPI monitoring, bottleneck removal
- Team leadership, accountability, organization design
- External communication, strategic memos, investor and board updates
- Market entry, partnerships, customer and market decisions
- Prioritization and execution follow-through

### Known Limitations

- This is still a single local HTML file, not a Next.js app.
- Data is stored only in browser localStorage.
- No export/import button yet.
- Skill XP recalculation is not fully event-sourced. Editing or deleting old logs does not automatically reverse previously awarded skill XP.
- Timer state is not persisted after browser refresh.
- No real AI review integration yet.

### Suggested Next Version

v0.3 should focus on:

- Export/import JSON backup.
- Better image-like fantasy map styling.
- Proper skill XP ledger so editing/deleting logs recalculates XP safely.
- A `Session Detail` view separate from the edit form.
- Weekly AI review prompt generator.
- Optional conversion to Next.js + TypeScript once the local prototype feels right.

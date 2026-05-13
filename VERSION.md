# Plan RPG Version Notes

## v0.3.7 - 2026-05-13

### Goal

Let the user update real goal progress inside the app and capture loose todos as today/later reminders before converting them into 20-minute tasks.

### Main Changes

- Added goal progress editing in the quest detail panel for metric-based goals.
  - Users can update `currentValue` and `targetValue`.
  - Progress is recalculated from `currentValue / targetValue`.
- Added `待办 / 今日提醒` page.
  - New todos can be captured without starting a session immediately.
  - Todos have title, note, due date, priority, GMN, and quest classification.
  - Due today or overdue todos appear under `今日提醒`.
  - Future todos appear under `晚点做`.
- Added simple auto-classification for todos.
  - Bank/payment keywords route to `提升汇款速度和方案`.
  - RFQ/quote/component keywords route to `更新报价`.
  - Logistics keywords route to `处理物流琐事`.
  - SOP/system/promotion keywords route to `培训与推广系统`.
  - Health/meditation/customer keywords route to matching quests.
- Added `开始20分钟` on todo cards.
  - Converts a todo into a 20-minute task.
  - Opens the Focus page with the generated task selected.
- Added `Todo Reminder` to the data model notes.

## v0.3.6 - 2026-05-13

### Goal

Correct the displayed goals and progress so the map matches the user's Excel source instead of hand-written placeholder progress.

### Main Changes

- Replaced the incorrect `DFK 公司赚钱 / 每月 50 个货柜` annual campaign with the Excel-based 2026 goal `推广平台 / 稳定 300 CBM / 月`.
- Added `重复出货物流客户` as its own 2026 annual campaign with `3 / 7` progress.
- Kept `元器件业务进账 ≥10万` as a separate 2026 annual campaign with `900 / 100000` progress.
- Updated `提升汇款速度和方案` to use `0 / 150000` and link to both `BUSINESS` and `PASSIVE`.
- Updated `MEDITATION` and `HEALTH` to use explicit current/target values.
- Added computed progress from `currentValue / targetValue`; progress is no longer manually hard-coded for these goals.
- Added normalization so old browser localStorage data is corrected when the page opens.

## v0.3.5 - 2026-05-11

### Goal

Make the 20-minute timer follow real elapsed time even if the browser tab is hidden, throttled, or briefly freezes.

### Main Changes

- Changed the timer from "subtract 1 every interval" to "calculate remaining time from the real ending timestamp".
- Added timer sync when the page visibility changes.
- Prevented browser lag from stretching a 20-minute session longer than 20 real minutes.

## v0.3.4 - 2026-05-11

### Goal

Make the daily work entrances under INSO, DFK, and passive-income collection match the user's real workflow.

### Main Changes

- INSO now has three work entrances:
  - `更新报价`
  - `开发客户`
  - `联系客户`
- DFK now has two work entrances:
  - `更新系统`
  - `处理物流琐事`
- `收款和资金通道` now has two work entrances:
  - `更新系统`
  - `处理银行业务`
- Added matching 20-minute preset tasks for each entrance.
- Updated migration rules so older local browser data moves into the new entrances.

## v0.3.3 - 2026-05-11

### Goal

Correct the annual goal ownership for INSO and passive-income collection work.

### Main Changes

- Moved `INSO 元器件收入` out of `DFK 公司赚钱`.
- Kept INSO under `BUSINESS` as its own 2026 goal for元器件客户、RFQ、报价和成交推进.
- Moved `收款和资金通道` out of DFK and into `PASSIVE INCOME`.
- Updated migration rules so older local browser data is corrected automatically.

## v0.3.2 - 2026-05-11

### Goal

Make `DFK 公司赚钱` work like a real annual goal with several parallel chapters, instead of forcing every business action into `系统优化`.

### Main Changes

- Renamed the DFK chapter from `第一章：优化公司系统` to `系统优化`.
- Added `客户维护杂事` as a separate chapter under `DFK 公司赚钱`.
- Moved `客户开发与报价` and `收款和资金通道` under `DFK 公司赚钱`.
- Added preset customer maintenance actions:
  - `处理客户日常消息`
  - `跟进客户杂事清单`
  - `更新客户订单状态`
- Moved `培训SOP拆分` into `系统优化`.
- Updated migration rules so existing local browser data is normalized into the new chapter structure.

## v0.3.1 - 2026-05-11

### Goal

Clarify the business hierarchy so the app opens on the real DFK execution path.

### Main Changes

- Changed the default focus from `MINDSET` to `BUSINESS`.
- Updated the 2026 goal to `DFK 公司赚钱`.
- Set the 2026 target to `每月 50 个货柜`.
- Made `第一章：优化公司系统` a chapter under `DFK 公司赚钱`, not a peer-level annual goal.
- Updated the first chapter preset tasks:
  - `梳理 DFK 当前系统问题`
  - `优化报价和订单流程`
  - `调整 DFK 业务记录方式`
- Added migration protection so old localStorage data is normalized into this DFK hierarchy.

## v0.3.0 - 2026-05-11

### Goal

Make Plan RPG handle real execution drift instead of forcing every session to follow the original plan.

### Map IA Update

- Rebuilt the map as a four-layer structure:
  - `2030 Life Grid`
  - `2026 Annual Campaign`
  - `Weekly Quest`
  - `20min Task`
- Added color and badge rules for:
  - Main
  - Side
  - Maintenance
  - Noise
  - Emergency
  - Pivot
- Added GMN tags on map nodes:
  - G = Growth
  - M = Maintenance
  - N = Noise
- The right detail panel now shows linked 2030 goal, linked 2026 goal, quest type, GMN, status, next action, session logs, pivot history, and emergency reason.
- Emergency cards can be reclassified after completion as main, side, maintenance, or noise.

### Main Changes

- Added Random Event / 突发任务:
  - Quick create button from the focus screen.
  - Required fields stay light: title, quest type, GMN, reason.
  - Advanced fields include description, estimated sessions, source, linked goal, and priority.
  - Random events become normal executable tasks and flow into session logs.
- Added Task Pivot / 任务转向:
  - Rename Task.
  - Pause A and Create B.
  - Complete A as Discovery and Create B.
  - Keeps original task history and writes pivot fields into the session log.
- Added dynamic weekly review stats:
  - Random event count and minutes.
  - Random event G/M/N split.
  - Pivot count and A-to-B trail.
  - Maintenance/noise visibility.
  - Random events worth promoting to formal main/side tasks.
- Added mock random event data and a small Node test file:
  - `tests/test_plan_rpg_logic.js`

### Data Model Additions

- Task:
  - `is_random_event`
  - `quest_type`
  - `estimated_sessions`
  - `reason`
  - `source`
  - `linked_goal_id`
  - `priority`
  - `pivot_status`
  - `original_title`
  - `current_title`
  - `pivot_reason`
  - `discovery_note`
  - `generated_task_id`
- Session Log:
  - `is_random_event`
  - `is_pivoted`
  - `original_task_id`
  - `actual_task_id`
  - `pivot_note`

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

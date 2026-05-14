# Plan RPG Version Notes

## v0.3.23 - 2026-05-14

### Goal

Stop the bottom progress panel from overlapping the map content.

### Main Changes

- Changed the annual progress / weekly achievement panel from absolute positioning to normal page flow.
- Removed the extra reserved bottom padding that made the dark panel appear between map sections.
- Kept the active timer return panel separate as a fixed floating card.
- Updated visible version labels to `v0.3.23`.

## v0.3.22 - 2026-05-14

### Goal

Make the active focus-session return entry impossible to miss on the map.

### Main Changes

- Changed the `正在专注` timer card from a bottom map-grid item into a fixed floating panel.
- The timer return panel now stays visible in the lower-right corner of the map instead of being pushed inside the scroll area.
- Added stronger contrast, tabular timer numbers, and a full-width return button.
- Updated visible version labels to `v0.3.22`.

## v0.3.21 - 2026-05-14

### Goal

Keep an active 20-minute session recoverable after returning to the map, and prevent accidental timer resets when starting another task.

### Main Changes

- Preserved the active timer when the user returns to the map or re-renders the focus page.
- Kept the map `正在专注` panel as the return entry for the current timer.
- When starting a different task while a session is active, the page now asks whether to return, finish the previous log first, or abandon it and start a new one.
- If the user chooses to finish the previous log first, the pending new session starts automatically after saving.
- Updated visible version labels to `v0.3.21`.

## v0.3.20 - 2026-05-14

### Goal

Simplify the chapter detail panel so it only supports fast recording at first glance.

### Main Changes

- Reduced the chapter/detail first view to:
  - Chapter title
  - Current GMN type
  - `开始记录`
  - `修改 GMN`
- Moved progress editing, task list, custom task form, recent logs, and random-event classification into collapsed `更多记录设置`.
- Moved GMN selectors behind collapsed `修改 GMN`.
- Changed `开始记录` to use the selected/default task and start a default 20-minute timer immediately.
- Removed chapter description and explanatory text from the first visible detail area.

## v0.3.19 - 2026-05-14

### Goal

Make Google Sheet sync work without manually entering the Apps Script URL every time.

### Main Changes

- Added a built-in default Apps Script Web App URL:
  - `https://script.google.com/macros/s/AKfycby6PAN6jVJrL7Z9QGzIdr_aaeyE8kpTjjBtWQXQMvP621P_CyfrW5R-M0gNPQQt9PHU/exec`
- Added a built-in default sync token matching the repository Apps Script template:
  - `CHANGE_ME_PLAN_RPG_TOKEN`
- Existing saved browser settings still override the defaults.
- Updated visible version labels to `v0.3.19`.

## v0.3.18 - 2026-05-14

### Goal

Read shared focus session logs back from Google Sheet.

### Main Changes

- Added a `拉取记录` button in the Google Sheet sync panel.
- Added automatic `Session_Logs` pull on page load when sync is configured.
- Added a JSONP read path for Apps Script so GitHub Pages can read sheet rows without CORS blocking.
- Added Apps Script `doGet` action `get_session_logs`.
- Updated README to explain that focus logs now write to and read from Google Sheet.

## v0.3.17 - 2026-05-14

### Goal

Automatically send completed focus session logs to Google Sheet.

### Main Changes

- Added a sidebar `Google Sheet 同步` configuration panel.
  - Stores Apps Script Web App URL in localStorage.
  - Stores a lightweight sync token in localStorage.
- Added automatic `Session_Logs` POST after `完成并结算`.
- Added a fire-and-forget `no-cors` sync path suitable for GitHub Pages + Apps Script MVP.
- Added local pending queue fallback when the sync request throws.
- Added `google-apps-script/Code.gs` as the Apps Script backend template.
- Documented the Apps Script payload in `docs/data-modules.md`.

## v0.3.16 - 2026-05-14

### Goal

Create the Google Sheet data layer skeleton for the online map system.

### Main Changes

- Created Google Sheet `Plan RPG Map Data`.
- Added module tabs:
  - `Module_Index`
  - `Goals`
  - `Quests`
  - `Tasks`
  - `Session_Logs`
  - `Todos`
  - `Skills`
  - `Settings`
- Added first-row field headers for each module.
- Added `docs/data-modules.md` so future AI agents can locate data boundaries without reading the full app.
- Updated README with the Google Sheet link and module instructions.
- Imported the local backup `plan-rpg-backup-2026-05-14.json` into a data-filled Google Sheet:
  - `Plan RPG Map Data - Imported 2026-05-14`
  - Goals: 8
  - Quests: 26
  - Tasks: 33
  - Session logs: 4
  - Todos: 0
  - Skills: 8

## v0.3.15 - 2026-05-14

### Goal

Prepare the local Plan RPG app for GitHub Pages publishing.

### Main Changes

- Added `.nojekyll` so GitHub Pages serves the static files without Jekyll processing.
- Added GitHub Pages setup notes to `README.md`.
- Documented the expected public URL: `https://p380294249-spec.github.io/plan-rpg/`.
- Added a privacy reminder that GitHub Pages is a public webpage and real INSO/customer data should move to a protected Google Sheet data layer.

## v0.3.14 - 2026-05-14

### Goal

Make GMN editable for chapter-level map nodes and remove GMN from annual goal cards.

### Main Changes

- Removed GMN badges and GMN color class from the `2026 目标` cards.
- Added `修改章节 GMN` in the map detail panel.
- Kept `修改当前任务 GMN` for 20-minute actions.
- Chapter and task GMN choices now both save immediately and refresh the map.

## v0.3.13 - 2026-05-14

### Goal

Make the Business / INSO map clearer for review, and keep active timers visible after returning to the map.

### Main Changes

- Compressed INSO into three review branches:
  - `订单跟进`: orders, RFQ, quotes, deal progress, and related review.
  - `客户开发`: new customer development from 麦穗, LinkedIn, email, Google search, and similar sources.
  - `客户维护`: old-customer contact, relationship maintenance, regular interaction, and customer status observation.
- Updated the matching INSO preset tasks and Todo Inbox classification keywords.
- Added a `正在专注` module on the map when a timer is running or paused.
  - Shows remaining time, timer state, and current task.
  - Adds `返回计时` to jump back to the active focus session.

## v0.3.12 - 2026-05-14

### Goal

Add AI work automation as the main 2026 direction under `NEW THINGS`.

### Main Changes

- Changed `NEW THINGS` from a loose new-experience bucket into an AI automation goal.
- Added the measurable target: complete 10 AI automation workflows/MVPs and reduce daily core work to DFK ≤2 hours plus INSO ≤2 hours.
- Added the new AI hierarchy:
  - `研究 AI 日常工作自动化`
  - `快速将工作模式自动化`
  - `搭建 MVP`
  - `优化`
  - `可以推销`
- Added matching 20-minute preset tasks for finding automation opportunities, building MVPs, optimizing workflows, and turning internal tools into sellable cases.
- Updated Todo Inbox classification so AI / MVP / automation keywords route into the new AI automation branches.

## v0.3.11 - 2026-05-14

### Goal

Add three separate one-click workflows for code updates, data sync, and combined update+data sync.

### Main Changes

- Added `一键只更新系统_PLAN_RPG.cmd`.
  - Runs `git pull --ff-only origin main`.
  - Opens `index.html`.
- Added `一键只同步数据_PLAN_RPG.cmd`.
  - Finds the newest `plan-rpg-backup-*.json` in Downloads.
  - Copies it to `data/plan-rpg-data.json`.
  - Commits and pushes the data file to GitHub.
- Added `一键更新系统并同步数据_PLAN_RPG.cmd`.
  - Pulls latest code.
  - Syncs the newest exported data if available.
  - Opens `index.html`.
- Added `data/README.md` to document how data sync works.
- Added matching desktop entry scripts.

### Important Note

The scripts cannot directly read browser localStorage. Before syncing data, export data from the app using `备份/迁移 -> 导出数据`.

## v0.3.10 - 2026-05-13

### Goal

Make Todo Inbox classification match the user's life-grid hierarchy instead of one flat quest dropdown.

### Main Changes

- Replaced the flat `归类到` dropdown with two controls:
  - `人生分类`: Business, Passive, Health, Mindset, Family, Social Network, Interests, New Things.
  - `具体目标/章节`: filtered by the selected life category.
- Todo options now show hierarchy paths, such as `DFK 赚钱 / 稳定系统 / 财务`.
- Typing a todo now shows a classification suggestion without automatically changing the user's selected category.
- `采用建议` applies the suggested category, chapter, and GMN only when the user clicks it.
- Todo cards now display both the life category and the selected hierarchy path.

## v0.3.9 - 2026-05-13

### Goal

Make GMN classification editable by the user instead of being fixed by system defaults.

### Main Changes

- Added a `修改当前任务 GMN` control in the map detail panel.
- Added a `本次 GMN` selector on the focus/session page before saving a log.
- Session settlement, XP, and review stats now use the user's latest selected GMN.
- Random-event reclassification no longer forces GMN to G/M/N; the user keeps control of that judgment.

## v0.3.8 - 2026-05-13

### Goal

Recalibrate the goal system around the user's 2026 life-grid hierarchy.

### Main Changes

- Rebuilt the 2030 life-grid defaults around Business, Passive, Health, Mindset, Family, Social Network, Interests, and New Things.
- Set Business to contain the two 2026 main goals:
  - `DFK 赚钱`: target is roughly 50 containers per month across Guangzhou and Yiwu.
  - `INSO 稳定客户收入`: target is stable client income of 1WRMB per month.
- Reworked DFK into chapters and branches:
  - `稳定系统`
  - `财务`
  - `打印`
  - `人员管理`
  - `培训系统`
- Reworked INSO into:
  - `报价`
  - `开发客户`
  - `维护客户关系`
- Reworked Passive into `汇款系统` with:
  - `制作汇款流程`
  - `稳定客户`
  - `开发客户`
- Added Family / girl friend, travel, weekly weight measurement, daily meditation, mentor/network, hobby mastery, and new-things placeholders.
- Updated todo auto-classification and migration normalization to match the new hierarchy.

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

# Plan RPG Version Notes

## v0.3.73 - 2026-07-16

### Context for the next AI

User's own words for what this system is for: track where each day's time actually goes, see how far that is from the 2026/2030 goals, and make the whole thing feel like a game they get hooked on (web + mobile use both matter). This entry is a second optimization pass after v0.3.72 (sync perf + review UI). Everything below was verified with the existing `tests/*.js` suite (still 9/9 passing) plus a headless Chromium pass (Playwright, `/opt/pw-browsers/chromium`) at both desktop and a 390×844 mobile viewport — screenshots were inspected, not just "no console error".

### New: Focus Streak (连续打卡)

- `focusStreakState()` in `src/game/game-service.js` computes `{ current, best, activeToday }` from `data.logs` — a day counts as active if it has any log with `focusUnitsForLog(log) > 0` (i.e. a real Focus session, unit = 20 min). If today has no log yet, `current` is based on yesterday so an in-progress day doesn't zero out the streak display.
- Surfaced in two places: the Map screen's "今日挑战" mission panel (`renderGameMissionPanel` in `src/ui/render-game.js`) shows a small 🔥 badge, and the Game screen hero (`renderGame`) shows current + best streak plus a nudge ("今天还没打卡，别断掉") when the streak is alive but today isn't logged yet.
- Test coverage: `tests/test_game_layer.js` has a new streak scenario (5 logs across offsets `-5,-4,-2,-1,0` from today, gap at `-3`) asserting current/best streak both with and without today's log.
- This is intentionally separate from the existing Focus level/mission/reward-gacha system in `game-config.js` / `game-service.js` — it doesn't touch XP, missions, or rewards, just reads `data.logs` the same way `focusMissionStatus()` already does.
- **Not yet done**: no reward is tied to streak milestones (e.g. a 7-day streak bonus chest). If "make it addictive" is the next priority, that's the natural next hook — the reward pool/pity system in `game-config.js` already has all the plumbing, a streak-based mission would slot in next to `focusMissionStatus()`.

### New: "还差多少" distance-to-target text

- Added `remainingToTarget(value, target)` in `src/services/session-service.js` (simple `max(0, target - value)`, all goals/quests in this system are "more is better" — verified against `seed-data.js`, there's no "lower is better" metric type to worry about).
- Wired into the 2026 campaign cards (`renderCampaignGrid` in `src/ui/render-dashboard.js`) for both monthly-metric quests and plain value-based quests: the small text under the progress bar now reads e.g. `24 / 52 周 · 还差 28 周` instead of just `24 / 52 周`, and switches to `· 已达标` / `· 本月已达标` at 100%.
- **Deliberately not added** to the top-level 2030 life-grid goal cards (`renderLifeGrid`) — a goal can aggregate multiple campaigns with different units (次/柜/周/…), and `goalProgress()` already averages those as percentages; summing raw "remaining" numbers across mismatched units would show a nonsense figure. If this is wanted at the goal level, it needs either a unit-normalized rollup or per-unit sub-lines, not a single number.

### Mobile pass (390×844 viewport)

- Found and fixed one real bug: the new "历史最高连续 X 天" streak text in the Game screen hero card was overlapping/getting clipped at the top-right instead of wrapping to its own line. Root cause: it was a flex sibling with `flex-basis: 100%` inside a `flex-wrap: wrap` row — browsers are allowed to shrink a 100%-basis item to fit the remaining space on the current line instead of forcing a wrap, so it got squeezed instead of dropping down. Fixed by giving `.game-hero` its own `.game-hero-row` wrapper (title + stats) with the streak line as a separate full-width sibling below, not a flex item competing for the same row.
- Checked at 390px: Map, Game, Review (all 4 tabs + week jump + edit modal), Focus, Todos. No other layout bugs found. The Review screen's 4 metric cards (`Total`/`Growth`/`维护`/`Noise`) and the summary strip stack to 1 column below 760px — that's pre-existing intentional CSS (`@media (max-width: 760px)`), not something this pass touched.
- **Not checked yet**: Skills screen (`render-skills.js`) and the modals opened from Focus (随机事件/任务转向) at the 390px width — worth a pass if mobile issues keep showing up there.

### Carried over from v0.3.72 (still true)

- `get_bootstrap` Apps Script action needs a manual redeploy in script.google.com before the single-round-trip startup sync takes effect. Until redeployed, the client automatically falls back to the four separate `get_*` pulls (now individually deduped, so still faster than before v0.3.72 even without redeploying).

## v0.3.72 - 2026-07-16

### Sync Performance

- Fixed `pullMetricLogsFromSheet`, `pullTodosFromSheet`, and `pullGameEventsFromSheet` each making a redundant duplicate Apps Script request: the token-resolution call already carries the requested rows, so the second identical fetch was pure waste. Cloud reads for those three data types are now half the round trips.
- Added a `get_bootstrap` Apps Script action that returns Session Logs, Metric Logs, Todos, and Game Events in a single execution (one spreadsheet open, not four). The client now pulls everything at startup with `pullAllFromSheet`, one round trip instead of up to eight, and transparently falls back to the four separate pulls if the Apps Script deployment hasn't been updated yet.

### Weekly Review UI

- The log edit panel is now a modal (matching the existing 突发任务 / 任务转向 modal pattern) instead of an inline panel embedded in the Review screen. Editing a log from the Focus results screen no longer force-navigates you away to Review.
- Split the Review screen's long stacked analysis into tabs (主要花在哪里 / 问题·亮点 / 动态视图 / 下周路线) to cut down on scrolling.
- Added a week-jump dropdown next to the ← 上一周 / 下一周 → buttons so you can go straight to any of the last 12 weeks instead of stepping through one at a time.
- Color-coded the 对比前一周 delta and 方向判断 badge (green/amber/red) for an at-a-glance read.

## v0.3.71 - 2026-07-15

### Chinese Labels

- Removed the remaining English headings from the reward modal, reward navigation, and Skills navigation.

## v0.3.70 - 2026-07-15

### Chinese Game UI

- Replaced the visible English reward and Skill interface labels with Chinese game wording.
- Reworked Focus titles as `专注新兵` -> `沉浸工匠` -> `专注骑士` -> `时间炼金师`.
- Kept internal IDs, progression rules, and historical data unchanged.

## v0.3.69 - 2026-07-15

### Reward Interaction

- Rebuilt the Focus reward interaction around a concealed 2-second charge, rarity-specific burst reveal, and a 15-draw Legendary guarantee.
- Added the reward redemption state machine: unredeemed -> redeeming -> completed / expired.
- Added timed reward countdowns, optional spending notes, expiry scan, and historical redemption-rate feedback.
- Kept rewards event-sourced in `gameEvents`, so draw and redemption state continue to sync through the existing `Game_Events` Google Sheet tab.

## v0.3.68 - 2026-07-15

### Mindset

- Added a separate `复盘` chapter under MINDSET, with a default 20-minute `G` action.
- Grouped MINDSET into `冥想` and `复盘` cards while keeping meditation history and its 80-session baseline separate from review records.

## v0.3.67 - 2026-07-15

### Active Skills

- Added a new Active Skills architecture with seven RPG character attributes: Focus, Sales, Communication, Language, Management, Investment, and AI & Systems.
- Preserved legacy `data.skills` for historical `skillXp` records, and separated them from active character progression.
- Focus now has the first confirmed progression rule: one completed 20-minute focus session equals one Focus progress.
- Rebuilt the Skills screen around level, title, lifetime progress, annual progress, 2030-ready fields, milestones, achievements, mentor inspiration, recent activity, and legacy archive.

## v0.3.66 - 2026-07-15

### Skills Navigation

- Renamed the left navigation entry from `CEO 技能树` to `技能 / Skills` so the Skills module is easier to find.
- Added a sidebar shortcut from the Skills preview to the full Skills page.
- Added a clear count on the Skills detail page showing all available CEO skills.

## v0.3.65 - 2026-07-15

### Game Layer

- Added a modular FOCUS reward engine on top of existing focus logs without changing historical records.
- Added Daily Mission `5 Focus`, Weekly Mission `30 Focus`, reward chests, configurable rarity weights, pity counters, draw history, and Inventory.
- Added a new `奖励 / Game` page plus a home mission panel showing TODAY/WEEK progress and claim buttons.
- Added `gameEvents` as an event ledger for reward draws and reward usage, with optional Google Sheet sync through a new `Game_Events` tab after Apps Script redeploy.

## v0.3.64 - 2026-07-15

### Focus Session

- Removed the extra `行动` selector from the focus panel; focus selection is now only `目标` plus `模块`.
- Changing modules during an active timer no longer opens the cancel/switch prompt.
- If the session started on one task but ends with another module selected, settlement asks whether to save under the original task or the currently selected module.

## v0.3.63 - 2026-07-15

### Focus Session

- Replaced the visible current-task dropdown with button-based focus selection for goal/module/action choices.
- Added a `值得记录` toggle to mark useful sessions for later review, and synced that flag through local data and Google Sheets rows.
- Reworked the XP preview into a compact reward strip so the left focus panel no longer overflows.
- Updated the Apps Script session writer to add missing `mood_stress` / `worth_recording` headers automatically.

## v0.3.62 - 2026-07-15

### Focus Session

- Simplified ordinary 20-minute sessions into a lightweight action log: current context, current task, timer, GMN, and one `做了什么` field.
- Hid random-event, pivot, and draft buttons from the main focus flow so the daily recording path stays one-button start and one-button settlement.
- Meditation keeps its special two-field mode: scene plus feeling/mood.
- Ordinary session saves now ignore hidden legacy reflection fields, preventing stale text from being written into new logs.

## v0.3.61 - 2026-07-10

### Focus Timer

- Fixed the pending focus settlement flow: if a timer has reached zero and the user had switched to `Quick Metric Log`, the `填写并结算` action now forces the page back to the normal session log form.
- The floating timer panel return button also resets the record type to `20min Session`, so the completed focus record is always editable before settlement.

### Metric Log UI

- Centered the `Quick Metric Log` form when metric mode is selected, avoiding the previous left-column-only layout that looked broken on desktop.

## v0.3.60 - 2026-07-06

### Weekly Planning

- Updated this week's two focus cards to `DFK 核对财务和制定制度` and `INSO 快速开发系统`.
- The matching 20-minute focus sessions now open with the same task names as the weekly cards.

### Weekly Review

- Added a compact previous week / current week / next week selector to the review page.
- Renamed the navigation entry to `周复盘` so the feature is easier to find.
- Review totals, GMN counts, focus areas, notes, logs, comparison, and next-route suggestions now follow the selected week.
- The next-week button stops at the current week, so the review never drifts into empty future weeks.

## v0.3.59 - 2026-06-26

### Focus Timer

- Regular focus sessions now stay in a `待填写记录` state when the timer reaches zero instead of disappearing.
- The active timer return panel is now global, so it remains visible from Todo, Review, Skills, and other screens.
- The floating panel changes to `专注已到点` with a `填写并结算` action that returns to the session log form.
- Meditation keeps its existing auto-save behavior when its countdown ends.

## v0.3.58 - 2026-06-25

### Sync

- Fixed the real Todo sync bug: the app previously validated sync by checking `get_session_logs`, so an old Apps Script URL could look healthy even though it did not support `get_todos`.
- Todo pull/write now validates the Todo endpoint itself before using a saved URL, then falls back to the shared default Apps Script URL when needed.
- Pending Todo uploads also resolve against `get_todos`, so local-only Todos can be recovered to the cloud instead of silently writing to an old script.

## v0.3.57 - 2026-06-25

### Sync

- Browsers with an old or broken Google Sheet sync URL now automatically fall back to the default shared Apps Script URL.
- The working sync URL/token is saved back into that browser after verification, so the device stops staying on local-only cached Todos.
- Opening the Todo page now refreshes cloud Todos, and the Todo page has a small manual `同步` button.

## v0.3.56 - 2026-06-25

### Sync

- Todo writes now use a confirmable Google Apps Script JSONP path, which is more reliable on mobile browsers than blind POST-only writes.
- Added an automatic retry queue for unsent sync payloads. The app retries when it opens, returns to the foreground, or the device comes back online.
- Kept the existing POST Todo endpoint as a fallback for older deployments.

## v0.3.55 - 2026-06-24

### Sync

- Todos now write to and read from the shared Google Sheet `Todos` tab.
- New and completed todos update the same row by ID; opening the page and returning to it refreshes cloud data.
- Browsers using the retired Apps Script address automatically move to the new shared sync service.

## v0.3.54 - 2026-06-24

### Weekly Focus

- Set this week's two focus entries to `DFK 制定公司规则` and `快速处理报价系统`.

## v0.3.53 - 2026-06-23

### Goal

Make DFK and INSO monthly business data additive, clear, and independent from 20-minute work modules.

### Main Changes

- DFK now records incremental container counts against a monthly target of 30 containers; for example, entries of 3 and 2 display as `本月 5 / 30 柜 · 17%`.
- INSO income now uses the same monthly incremental record model against `10000 RMB`.
- The map automatically resets monthly display totals when the calendar month changes, while dated Metric Logs remain in Google Sheet and local data for annual totals.
- Simplified DFK chapters to: `公司系统维护` (G), `公司内部管理` (M), and `客户与物流事务` (N).
- Merged old printing records into company system maintenance and old personnel-management records into company internal management.

## v0.3.52 - 2026-06-23

### Fix

- Only the completion checkbox can now mark a Todo as done; clicking its text or empty card space no longer completes it.
- After adding a Todo, important and urgent reset to unselected while the selected category remains ready for the next entry.

## v0.3.51 - 2026-06-23

### Fix

- Added a version marker to every static CSS and JavaScript file reference so GitHub Pages visitors do not receive a new page with stale cached scripts.

## v0.3.50 - 2026-06-23

### Goal

Replace the old project-style Todo inbox with a quick daily DFK / INSO / OTHER checklist.

### Main Changes

- Added one-click DFK, INSO, and OTHER categories, plus independent important and urgent toggles.
- Rebuilt the pending list into four priority groups: urgent + important, urgent, important, and normal.
- Completing a todo now records `completed_at` and keeps the item in the expandable completion history.
- Migrated legacy Todo records into the new fields without deleting them.
- Removed old Todo-to-20-minute-task conversion, Goal, Quest, GMN, date, and note controls.
- Added a dedicated `src/services/todo-service.js` business module and mobile layouts for the new Todo screen.

## v0.3.49 - 2026-06-23

### Goal

Simplify meditation recording and remove unnecessary interface introductions.

### Main Changes

- Meditation now uses one `感受 / Mood` field instead of separate feeling and Mood inputs.
- The merged meditation feeling is preserved in both log fields used by existing Google Sheet sync.
- Removed task instructions, record-board help text, unfinished-session intro, and several static page descriptions.
- Reduced the saved-draft panel to a short status only.
- Updated visible version labels to `v0.3.49`.

## v0.3.48 - 2026-06-22

### Goal

Make the map dashboard concise and easy to operate on a phone.

### Main Changes

- Top bar now keeps only total focus time and weekly G ratio.
- Removed the dashboard path text and explanatory helper text.
- Weekly focus now shows only the two configured priorities and a start button.
- Goal cards keep title, type, progress, and measurable value without long descriptions.
- Added a compact mobile layout that hides sidebar utilities and keeps navigation accessible.
- Updated visible version labels to `v0.3.48`.

## v0.3.47 - 2026-06-12

### Goal

Restore meditation as a 10-minute mood/state session instead of a quick metric.

### Main Changes

- Removed the MINDSET quick metric shortcut.
- MINDSET detail now starts the 10-minute meditation session card.
- Meditation sessions still show progress count, but the record flow captures mood/state like before.
- When a meditation timer reaches zero, the session is saved automatically and progress updates from the new log.
- Updated visible version labels to `v0.3.47`.

## v0.3.46 - 2026-06-11

### Goal

Make the dashboard data-first and remove the redundant 20-minute action rail.

### Main Changes

- Removed the Dashboard `20 分钟行动` section and its render logic.
- Clicking a 2026 goal now opens that goal's own data/detail panel instead of jumping into its first chapter.
- BUSINESS 2026 goals show their current/target data directly on the goal cards.
- DFK and INSO goal details prioritize quick metric recording for containers/income.
- Updated visible version labels to `v0.3.46`.

## v0.3.45 - 2026-06-11

### Goal

Turn HEALTH into a result-only weight tracking goal instead of a 20-minute action.

### Main Changes

- HEALTH now tracks 52 weekly weight checks against 72KG +/- 5KG.
- Added 24 completed weeks through 2026-06-11 as the current-year baseline.
- Future HEALTH progress counts one in-range weight record per week after the baseline date.
- HEALTH opens Quick Metric weight entry directly and hides 20-minute action/task cards.
- Documented metric-only goals in the data schema.
- Updated visible version labels to `v0.3.45`.

## v0.3.44 - 2026-06-11

### Goal

Add the user's historical meditation completions that were not synced before.

### Main Changes

- Added a MINDSET meditation baseline of 80 historical completions.
- Meditation progress is now `baseline 80 + synced sessions + synced metric logs`.
- Documented `baselineValue` in the data schema.
- Updated visible version labels to `v0.3.44`.

## v0.3.43 - 2026-06-09

### Goal

Make the lower action card use the same real meditation progress count as the chapter card.

### Main Changes

- The 20-minute action card no longer shows the estimated task count for value-based quests.
- Meditation action cards now show `已完成 current / target 次` using the merged MINDSET count.
- Updated visible version labels to `v0.3.43`.

## v0.3.42 - 2026-06-09

### Goal

Make meditation progress display the real merged count instead of a misleading task count.

### Main Changes

- Removed the old seed progress baseline for MINDSET meditation.
- Recalculates meditation progress from merged logs and metric records each load/render.
- Shows value-based quest detail as `current / target unit` instead of estimated task count.
- Updated visible version labels to `v0.3.42`.

## v0.3.41 - 2026-06-09

### Goal

Make the merged single-level Mindset meditation entry start the correct 10-minute task from the dashboard.

### Main Changes

- Fixed dashboard selection for goals that do not have child chapters.
- When selecting MINDSET, the right-side `开始记录` action now selects `Q-004 / T-007` instead of keeping the previous task.
- The chapters section now shows the single selected quest when there are no child chapters.
- Updated visible version labels to `v0.3.41`.

## v0.3.40 - 2026-06-09

### Goal

Make meditation use a 10-minute default while keeping merged Mindset history.

### Main Changes

- Changed the unified meditation action `T-007` default duration from 20 minutes to 10 minutes.
- Kept the v0.3.39 migration that maps old Mindset quest/task IDs into `Q-004 / T-007`.
- Updated visible version labels to `v0.3.40`.

## v0.3.39 - 2026-06-08

### Goal

Merge all Mindset branches/actions into one Meditation entry so completion data is not split.

### Main Changes

- Kept `Q-004 / T-007` as the only active MINDSET meditation quest/action.
- Removed old default MINDSET branches for smile, read, bad things, and mental model steps from the seed map.
- Normalizes old local/cloud logs from the deprecated MINDSET quest/task IDs into `Q-004 / T-007`.
- Normalizes old todos and metric logs so MINDSET progress routes to meditation.
- Merged old meditation-related records into the unified meditation progress.
- Updated visible version labels to `v0.3.39`.

## v0.3.38 - 2026-05-21

### Goal

Polish the UI so the app feels more like a focused daily command center.

### Main Changes

- Reduced the decorative map background and shifted the interface toward a cleaner workbench layout.
- Improved visual hierarchy for weekly focus cards, panels, stats, and the right-side action detail.
- Added clearer hover/focus states and softer shadows for clickable cards.
- Made the sidebar sticky and tightened spacing so the main work area has more room.
- Updated visible version labels to `v0.3.38`.

## v0.3.37 - 2026-05-20

### Goal

Split the single-file frontend into a maintainable static module structure.

### Main Changes

- Moved CSS from `index.html` to `src/ui/styles.css`.
- Moved default seed data to `src/models/seed-data.js`.
- Filled the existing `src/storage`, `src/services`, `src/state`, and `src/ui` folders with extracted app logic.
- Kept the safe GitHub Pages script model: plain `<script src>` loading, no bundler, no ES module migration.
- Reduced `index.html` to the page shell plus stylesheet/script links.
- Preserved existing localStorage keys, Google Sheet fields, Apps Script actions, timer behavior, GMN editing, and weekly focus behavior.
- Updated visible version labels to `v0.3.37`.

## v0.3.36 - 2026-05-20

### Goal

Make the dashboard default view focus on this week's two main G tasks.

### Main Changes

- Added a `本周作战` panel at the top of the map.
- Default weekly focus is DFK `财务` and INSO `客户维护`.
- Shows whether each focus has been completed today and gives a completion message when both are done.
- Added one-click start buttons for each weekly focus.
- Made 2030 life-grid, 2026 goals, and chapters collapsible and collapsed by default.
- Keeps `20 分钟行动` expanded.
- Stores collapse state in localStorage.
- Updated visible version labels to `v0.3.36`.

## v0.3.35 - 2026-05-20

### Goal

Keep mental model tasks as 20-minute focus sessions.

### Main Changes

- Changed all six mental model chapter tasks from 10 minutes to 20 minutes.
- Changed the nap/wake-up mental model case task to 20 minutes.
- Updated visible version labels to `v0.3.35`.

## v0.3.34 - 2026-05-20

### Goal

Expand the mental model system into a six-step action loop.

### Main Changes

- Rebuilt `建立心智模型系统` around six chapters:
  `真实场景还原`, `问题识别`, `能力归类`, `找对应高手`, `提炼动作模型`, `现实测试复盘`.
- Added default tasks for each chapter.
- Added the nap/wake-up example as a concrete test task.
- Updated visible version labels to `v0.3.34`.

## v0.3.33 - 2026-05-20

### Goal

Move reading under Mindset and add a mental model system branch.

### Main Changes

- Removed `READ` from the 2030 life-grid categories.
- Moved the `READ` quest under `MINDSET`.
- Added `建立心智模型系统` as a Mindset chapter.
- Added a default task for building one reusable mental model card.
- Added normalization to drop old local `READ` life-grid entries.
- Updated visible version labels to `v0.3.33`.

## v0.3.32 - 2026-05-20

### Goal

Let an old computer upload its local-only focus history into the shared Google Sheet.

### Main Changes

- Added a local pre-pull safety snapshot for browser-only session logs.
- Added `上传本机记录` in the Google Sheet sync panel.
- Upload compares local/preserved log IDs against Google Sheet and sends only missing session logs.
- After upload, the app refreshes from Google Sheet so the screen uses the cloud source of truth.
- Updated visible version labels to `v0.3.32`.

## v0.3.31 - 2026-05-20

### Goal

Make focus minutes consistent across different computers.

### Main Changes

- When Google Sheet sync is configured, `Session_Logs` now treats Google Sheet as the source of truth after pull.
- Replaced the old browser-local merge behavior that could keep stale local logs and show different total focus minutes per device.
- Updated sync status copy to show the cloud record count after refresh.
- Updated visible version labels to `v0.3.31`.

## v0.3.30 - 2026-05-20

### Goal

Make meditation focus sessions easier to finish or cancel when opened by mistake.

### Main Changes

- Changed MEDITATION chapter and default meditation task GMN from `M` to `G`.
- Kept meditation default duration at 10 minutes.
- Fixed map/detail start flows so meditation no longer gets forced to 20 minutes.
- Added an inline `取消本次` button inside the focus timer panel.
- Updated meditation todo auto-classification to default to `G`.
- Updated visible version labels to `v0.3.30`.

## v0.3.29 - 2026-05-17

### Goal

Make monthly BUSINESS metrics faster to record and simplify the right-side detail panel.

### Main Changes

- Added quick metric entry buttons for DFK monthly container count and INSO monthly income.
- Removed the right-side completion status block from the chapter detail panel.
- Removed the right-side preset task list from the chapter detail panel.
- Updated visible version labels to `v0.3.29`.

## v0.3.28 - 2026-05-17

### Goal

Make active focus sessions easier to stop from the map and clean up BUSINESS mainline vs side-branch defaults.

### Main Changes

- Added a cancel button to the active focus floating panel so an unfinished 20-minute session can be stopped from the map.
- Updated BUSINESS default structure: DFK 财务/培训 and INSO 客户开发 are the emphasized mainline branches; other related chapters/actions are lighter side branches.
- Updated INSO default 20-minute actions for 客户开发、订单跟进、客户维护.
- Updated visible version labels to `v0.3.28`.

## v0.3.27 - 2026-05-17

### Goal

Backfill the annual goal and metric defaults from the provided planning sheet screenshot.

### Main Changes

- Added missing Quick Metric style goals/quests:
  - `Record the smile`
  - `READ`
  - `Record the Bad things`
- Updated several current/target values from the planning sheet, including INSO monthly profit, Health, Meditation, Girl Friend, New Things, and Interests.
- Clarified which items should be Quick Metric Logs instead of 20-minute sessions.
- Updated metric type routing so Weight, RFQ/Income/Customer, Reading, Meditation, Good Things, and Bad Things update the right Quest.
- Updated visible version labels to `v0.3.27`.

## v0.3.26 - 2026-05-17

### Goal

Unify the recording entry so focused work and quick result metrics are logged from one screen.

### Main Changes

- Added `Record Type` to the record screen:
  - `20min Session`
  - `Quick Metric Log`
- Quick Metric Log hides the timer and session fields.
- Added metric fields: Date, Goal, Metric Type, Value, Unit, and Note.
- Added `metricLogs` to app data and normalizes old browser data safely.
- Saving a Quick Metric Log updates the current month value for the matching Goal/Quest so Dashboard progress can move without forcing a 20-minute timer.
- Added `Metric_Logs` read/write support to Apps Script.
- Added Mood / Stress to 20min Session records.
- Updated visible version labels to `v0.3.26`.

## v0.3.25 - 2026-05-17

### Goal

Turn weekly review into a single-page direction check instead of just a raw log list.

### Main Changes

- Added a weekly review summary for Monday to Sunday.
- Added this-week vs last-week minute comparison.
- Added a simple direction badge based on how much time stayed in `G`.
- Added a "where time went" section showing the main quests/modules of the week.
- Added merged sections for problems, solutions, good points, and bad points from the week's logs.
- Updated next-week route suggestions so they are based on this week's activity plus unfinished annual priorities.
- Updated visible version labels to `v0.3.25`.

## v0.3.24 - 2026-05-17

### Goal

Make Google Sheet sync work automatically on a new computer without manual localStorage setup.

### Main Changes

- Added explicit default sync constants in the frontend:
  - `DEFAULT_APPS_SCRIPT_URL`
  - `DEFAULT_SYNC_TOKEN = plan-rpg-2026`
- When no sync config exists, the app now writes the default URL/token into `localStorage` automatically.
- Opening the page still auto-runs the `Session_Logs` pull after the default config is available.
- Added token probing so the app can use the new default token after Apps Script is redeployed while still reading/writing against the currently deployed legacy token during transition.
- Updated `google-apps-script/Code.gs` to use `plan-rpg-2026`.
- Updated visible version labels to `v0.3.24`.

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

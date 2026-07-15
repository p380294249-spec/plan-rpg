// src/models/data-schema.js
// Data structure reference for Plan RPG.
// This file is documentation only. No executable logic here.
// Update this file when fields are added or removed in index.html.

/*
 * GOAL2030
 * Stored in: localStorage (STORAGE_KEY) under data.goals2030
 * Seed: seed.goals2030
 * Fields:
 *   id            - string, unique goal ID (e.g. "BUSINESS", "HEALTH")
 *   title         - string, human-readable title
 *   currentValue  - number, current progress value
 *   targetValue   - number, target value for progress calculation
 *   baselineValue - number (optional), historical count added before synced records
 *   baselineThrough - string (optional), date covered by baselineValue
 *   unit          - string, unit of measurement (e.g. "个主目标", "周")
 *   role          - string, category: "Mainline" | "Habit" | "Life" | "Sideline"
 *   displayTitle  - string (optional), override display text (e.g. "PASSIVE INCOME")
 */

/*
 * QUEST
 * Stored in: localStorage (STORAGE_KEY) under data.quests
 * Seed: seed.quests
 * Fields:
 *   id              - string, unique quest ID (e.g. "Q-001")
 *   parentQuestId   - string (optional), parent quest ID for chapter hierarchy
 *   name            - string, quest name
 *   type            - string: "Main" | "Side" | "Habit"
 *   goal            - string, linked Goal2030 ID
 *   target          - string, human-readable target description
 *   currentValue    - number (optional), current progress value
 *   targetValue     - number (optional), target value
 *   baselineValue   - number (optional), historical count added before synced records
 *   baselineThrough - string (optional), date covered by baselineValue
 *   unit            - string (optional), unit of measurement
 *   recordMode      - string (optional), "metric" means result-only tracking, no 20min task needed
 *   monthlyMetric   - boolean (optional), aggregate Metric Logs for the current calendar month and reset display at the next month
 *   description     - string, detailed description
 *   nextMove        - string, recommended next action
 *   status          - string: "In Progress" | "Not Started" | "Done" | "Paused" | "Discovery" | "Promoted" | "Filed as Noise" | "Filed as Maintenance"
 *   gmn             - string: "G" | "M" | "N"
 *   priority        - string: "High" | "Medium" | "Low" | "Urgent"
 *   icon            - string, emoji icon
 */

/*
 * TASK
 * Stored in: localStorage (STORAGE_KEY) under data.tasks
 * Seed: seed.tasks
 * Normalized by: normalizeTasks()
 * Fields:
 *   id                  - string, unique task ID (e.g. "T-001")
 *   questId             - string, linked Quest ID
 *   name                - string, original task name
 *   current_title       - string, current display title (may differ after pivot/rename)
 *   original_title      - string, original title at creation
 *   instruction         - string, what to do in this session
 *   minutes             - number, default session duration (default 20)
 *   standard            - string, completion criteria
 *   gmn                 - string: "G" | "M" | "N"
 *   skillIds            - string[], linked CEO skill IDs
 *   status              - string: "Not Started" | "Done" | "Paused" | "Discovery"
 *   // The following fields are added by normalizeTasks() if missing:
 *   is_random_event     - boolean, whether this is an ad-hoc event
 *   quest_type          - string: "main" | "side" | "maintenance" | "noise"
 *   estimated_sessions  - number, estimated sessions needed (default 1)
 *   reason              - string, why this task exists
 *   source              - string: "manual" | "emergency" | "interruption"
 *   linked_goal_id      - string, linked Goal2030 ID
 *   priority            - string: "high" | "medium" | "low" | "urgent"
 *   pivot_status        - string: "none" | "renamed" | "paused_for_new_task" | "completed_as_discovery"
 *   pivot_reason        - string, reason for pivot
 *   discovery_note      - string, what was discovered
 *   generated_task_id   - string, ID of task generated from this pivot
 */

/*
 * SESSION_LOG
 * Stored in: localStorage (STORAGE_KEY) under data.logs + Google Sheets (Session_Logs tab)
 * Created by: saveSession(), applyPivot()
 * Normalized by: normalizeLog()
 * Fields:
 *   id                - string, unique log ID (e.g. "L-001")
 *   date              - string, YYYY-MM-DD format
 *   minutes           - number, actual session duration
 *   gmn               - string: "G" | "M" | "N"
 *   questId           - string, linked Quest ID
 *   taskId            - string, linked Task ID (the task being logged)
 *   whatDone          - string, what was accomplished
 *   problem           - string, problems encountered
 *   solution          - string, how problems were solved
 *   good              - string, what went well
 *   bad               - string, what could be improved
 *   nextStep          - string, next action
 *   moodStress        - string, mood/feeling note, mainly used by meditation logs
 *   worthRecording    - boolean, user marked this session as worth preserving/reviewing
 *   skillXp           - SkillXpEvent[], XP awarded to skills
 *   is_random_event   - boolean, whether logged task was a random event
 *   is_pivoted        - boolean, whether this log involved a pivot
 *   original_task_id  - string, original task ID before pivot
 *   actual_task_id    - string, actual task ID after pivot (may equal original_task_id)
 *   pivot_note        - string, human-readable pivot description
 */

/*
 * METRIC_LOG
 * Stored in: localStorage (STORAGE_KEY) under data.metricLogs + Google Sheets (Metric_Logs tab)
 * Created by: saveMetricLog()
 * Fields:
 *   id          - string, unique metric log ID
 *   date        - string, YYYY-MM-DD format; determines the month and year totals
 *   month       - string, YYYY-MM format
 *   goalId      - string, linked Goal2030 ID
 *   metricType  - string, e.g. "DFK 装柜" or "INSO 收入"
 *   value       - number, incremental amount to add
 *   unit        - string, e.g. "柜" or "RMB"
 *   note        - string, optional context
 *   createdAt   - string, ISO datetime
 *   updatedAt   - string, ISO datetime
 *
 * Monthly business metrics display only the current month total on the map.
 * The dated rows remain available for annual totals and Google Sheet history.
 */

/*
 * TODO
 * Stored in: localStorage (STORAGE_KEY) under data.todos + Google Sheets (Todos tab)
 * Created by: addSimpleTodo()
 * Normalized by: normalizeTodos()
 * Fields:
 *   id              - string, unique todo ID
 *   category        - string: "DFK" | "INSO" | "OTHER"
 *   content         - string, short todo content
 *   is_starred      - boolean, important marker
 *   is_urgent       - boolean, time-pressure marker
 *   status          - string: "pending" | "done" | "cancelled"
 *   created_at      - string, ISO datetime
 *   completed_at    - string, ISO datetime (empty until done)
 *   updated_at      - string, ISO datetime
 *
 * Sync: syncTodoToSheet() upserts by id. On startup and when the page regains focus,
 * pullTodosFromSheet() merges records using updated_at, so newer changes win.
 */

/*
 * SKILL
 * Stored in: localStorage (STORAGE_KEY) under data.skills
 * Seed: seed.skills
 * Fields:
 *   id            - string, unique skill ID (e.g. "strategy", "operations")
 *   name          - string, display name with Chinese translation
 *   level         - number, current level (starts at 1)
 *   xp            - number, current XP
 *   maxXp         - number, XP needed for next level
 *   description   - string, what this skill covers
 *   requirements  - string[], LinkedIn-style requirement descriptions
 *   unlock        - string, reward unlocked at next level
 */

/*
 * SKILL_XP_EVENT
 * Not stored independently; embedded in SessionLog.skillXp
 * Created by: buildSkillXp()
 * Fields:
 *   skillId - string, linked Skill ID
 *   xp      - number, XP amount awarded
 */

/*
 * MODEL_ROW
 * Stored in: localStorage (STORAGE_KEY) under data.model
 * Seed: seed.model
 * Not a true entity; used for the data model documentation page.
 * Format: string[5] array per row:
 *   [0] - string, level name (e.g. "5-Year", "Annual", "Weekly")
 *   [1] - string, entity name (e.g. "2030 Goal", "Quest")
 *   [2] - string, purpose description
 *   [3] - string, key fields summary
 *   [4] - string, why it exists
 */

/*
 * SHEET_SYNC_CONFIG
 * Stored in: localStorage (APP_CONFIG.SHEET_SYNC_CONFIG_KEY)
 * Managed by: sheetSyncConfig(), saveSheetSyncConfig()
 * Fields:
 *   url   - string, Google Apps Script endpoint URL
 *   token - string, sync authentication token
 */

# Plan RPG Data Modules

Google Sheet:

https://docs.google.com/spreadsheets/d/1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg/edit

Sheet title:

`Plan RPG Map Data - Imported 2026-05-14`

## Purpose

This file defines the data boundary for the online Plan RPG map system.

The app code still lives in GitHub / GitHub Pages. The shared user progress should live in Google Sheet.

For future AI work, read this file first before reading the full `index.html`.

## Module Ownership

### Module_Index

Purpose:

Human-readable index of every data module.

Use this tab to understand where each data type lives.

### Goals

Purpose:

Stores top-level life-grid goal progress.

Fields:

`goal_id`, `display_title`, `title`, `role`, `current_value`, `target_value`, `unit`, `status`, `updated_at`, `notes`

App area:

2030 life grid and high-level progress cards.

Sync rule:

Update when a top-level goal progress value changes.

### Quests

Purpose:

Stores 2026 goals, chapters, branches, and chapter-level GMN.

Fields:

`quest_id`, `parent_quest_id`, `goal_id`, `name`, `level`, `type`, `gmn`, `current_value`, `target_value`, `unit`, `status`, `priority`, `target`, `description`, `next_move`, `updated_at`, `notes`

App area:

2026 goals, chapter map, branch map, and chapter GMN editor.

Sync rule:

Use `parent_quest_id` to rebuild hierarchy.

### Tasks

Purpose:

Stores 20-minute action definitions and task-level GMN/status.

Fields:

`task_id`, `quest_id`, `name`, `gmn`, `minutes`, `status`, `skill_ids`, `instruction`, `standard`, `source`, `updated_at`, `notes`

App area:

20-minute action rail, focus task selector, and task GMN editor.

Sync rule:

Custom tasks and task GMN/status changes should be upserted by `task_id`.

### Session_Logs

Purpose:

Stores completed focus sessions.

Fields:

`log_id`, `date`, `user`, `device`, `goal_id`, `quest_id`, `task_id`, `gmn`, `minutes`, `what_done`, `problem`, `solution`, `good`, `bad`, `next_step`, `skill_xp_json`, `created_at`, `updated_at`

App area:

Focus session completion, weekly review, total minutes, GMN ratios, skill XP calculation.

Sync rule:

Append-only first. Do not overwrite old logs unless an explicit edit flow is implemented.

### Todos

Purpose:

Stores todo inbox and reminders.

Fields:

`todo_id`, `title`, `note`, `due_date`, `priority`, `status`, `goal_id`, `quest_id`, `gmn`, `converted_task_id`, `created_at`, `updated_at`

App area:

Todo Inbox, Today reminders, Later list, todo-to-task conversion.

Sync rule:

Upsert by `todo_id`.

### Skills

Purpose:

Stores skill XP and levels.

Fields:

`skill_id`, `name`, `level`, `xp`, `max_xp`, `description`, `updated_at`

App area:

Skill mini panel, skill tree, XP reward preview.

Sync rule:

Can be derived from `Session_Logs`, but stored for fast display in the first MVP.

### Settings

Purpose:

Stores sync metadata.

Fields:

`key`, `value`, `updated_at`, `notes`

App area:

Future Google Sheet sync layer.

Current keys:

- `schema_version`: `map-sync-v1`
- `primary_write_mode`: `append_logs_then_merge`

## First Sync MVP

Build sync in this order:

1. Read `Session_Logs` on page load.
2. Append to `Session_Logs` when a focus session is completed.
3. Read and upsert `Todos`.
4. Upsert `Quests` when chapter GMN changes.
5. Upsert `Tasks` when task GMN/status changes.
6. Upsert `Goals` when progress values change.

## Apps Script Sync Endpoint

Script source in this repo:

`google-apps-script/Code.gs`

First deployed action:

`append_session_log`

Expected frontend payload:

```json
{
  "token": "your token",
  "action": "append_session_log",
  "module": "Session_Logs",
  "row": {
    "log_id": "L-...",
    "date": "2026-05-14",
    "user": "38029",
    "device": "browser user agent",
    "goal_id": "BUSINESS",
    "quest_id": "Q-011",
    "task_id": "T-004",
    "gmn": "G",
    "minutes": 20,
    "what_done": "...",
    "problem": "...",
    "solution": "...",
    "good": "...",
    "bad": "...",
    "next_step": "...",
    "skill_xp_json": "[]",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}
```

Frontend config is stored per browser in localStorage key:

`plan-rpg-sheet-sync-config-v1`

GitHub Pages cannot securely hide the endpoint or token. Use a low-risk token and do not put private customer data in this sync layer until access control is improved.

## Important Rules

- Do not put private customer data into GitHub Pages code.
- Google Sheet is the shared data layer.
- `index.html` seed data is still the default structure.
- Google Sheet data should override local browser data only after a sync conflict strategy is implemented.
- For the first version, keep localStorage as fallback cache.

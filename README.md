# Plan RPG

Plan RPG is a lightweight web MVP for turning yearly plans, weekly quests, 20-minute focus sessions, execution logs, rewards, skills, and reviews into a game-like personal planning system.

Current version: `v0.3.23`

Live app:

https://p380294249-spec.github.io/plan-rpg/

## Current Architecture

This project is a GitHub Pages + Google Apps Script + Google Sheets web app.

- `index.html` is the frontend and is published by GitHub Pages.
- `google-apps-script/Code.gs` is the lightweight API layer.
- Google Sheets stores shared focus-session data.
- Browser `localStorage` is used only as local cache/fallback for the current browser.
- There is no Node server, backend VM, or database server required to run the current MVP.

## What It Does

The MVP supports the core loop:

1. Choose a 2026 goal, chapter, or 20-minute action.
2. Start a default 20-minute focus session.
3. Save the session log with what happened, problems, solutions, good points, bad points, and next step.
4. Sync completed session logs to Google Sheets.
5. Pull session logs back from Google Sheets for review and progress summaries.

The main data path is:

```txt
GitHub Pages frontend
  -> Google Apps Script API
  -> Google Sheets
```

`localStorage` keeps the page usable when sync is unavailable, but Google Sheets is the intended shared storage layer for completed focus logs.

## Repository Structure

```txt
index.html                  Main GitHub Pages frontend
google-apps-script/Code.gs  Google Apps Script API
docs/data-modules.md        Google Sheet module/schema notes
VERSION.md                  Version history and handoff notes
tests/                      Lightweight logic checks
```

Version history belongs in `VERSION.md`, not in this README.

## GitHub Pages Deployment

Recommended GitHub Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

After pushing to `main`, GitHub Pages publishes the latest `index.html` to:

https://p380294249-spec.github.io/plan-rpg/

If the page does not update immediately, wait briefly and hard-refresh the browser.

## Google Sheets Storage

Current Sheet:

https://docs.google.com/spreadsheets/d/1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg/edit

Main shared tab currently used by the app:

- `Session_Logs`: completed 20-minute focus session logs.

Data module notes are documented in:

```txt
docs/data-modules.md
```

For future AI coding work, read `docs/data-modules.md` before changing sync logic.

## Apps Script API

The Apps Script source is:

```txt
google-apps-script/Code.gs
```

It currently supports:

- `GET action=get_session_logs`: read `Session_Logs`.
- `POST action=append_session_log`: append a completed session log.
- `POST action=ping`: test sync settings by writing to `Settings`.

The script uses:

```js
const SPREADSHEET_ID = '1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg';
const SYNC_TOKEN = 'CHANGE_ME_PLAN_RPG_TOKEN';
```

The token is lightweight protection for the MVP. Do not treat it as strong security for sensitive data.

## Update Apps Script

When `google-apps-script/Code.gs` changes:

1. Open the Google Apps Script project.
2. Replace the script content with `google-apps-script/Code.gs`.
3. Save.
4. Deploy a new Web App version.
5. Keep access settings compatible with the GitHub Pages frontend.
6. Use the app's Google Sheet sync panel to test the Web App URL and token.

The frontend has a default Apps Script URL and token, but browser-saved sync settings can override them.

## Updating the Web App

For frontend/documentation changes:

```bash
git add index.html README.md VERSION.md docs google-apps-script tests
git commit -m "describe the change"
git push origin main
```

GitHub Pages will publish the updated frontend after the push.

## Notes For Future AI Coding

- Keep README focused on current architecture and operation.
- Put version-by-version history in `VERSION.md`.
- Avoid reintroducing desktop-app, shortcut-script, or server-first positioning unless the product direction changes.
- Do not store private or sensitive business data directly in `index.html`.
- Treat Google Sheets as the current shared data store for this MVP.

# Plan RPG Data Sync

This folder stores the latest exported Plan RPG browser data for GitHub sync.

## Important

The app runs as a local `index.html`, so browser `localStorage` cannot be read directly by a `.cmd` script.

To sync data:

1. Open Plan RPG.
2. Click `导出数据`.
3. Run `一键只同步数据_PLAN_RPG.cmd`.

The script copies the newest `plan-rpg-backup-*.json` from your Downloads folder into:

```txt
data/plan-rpg-data.json
```

Then it commits and pushes that file to GitHub.

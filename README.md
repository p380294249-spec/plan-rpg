# Plan RPG / 计划 RPG

本项目是一个本地网页软件 MVP，用来把年度计划、每周计划、主线任务、支线任务、20 分钟专注、执行日志、奖励、技能成长和每周复盘串成一个游戏化系统。

当前版本：`v0.3.23`

## 文件说明

- `index.html`：主程序，双击即可打开。
- `VERSION.md`：版本记录和给后续 AI coding 的交接说明。
- `open_plan_rpg.cmd`：一键打开软件。
- `update_from_github.cmd`：一键从 GitHub 拉取更新，然后打开软件。
- `backup_project.cmd`：一键备份当前项目代码文件到 `backups/`。
- `.gitignore`：忽略本地备份和临时文件。

## 一键使用

在 Windows 上双击：

```txt
open_plan_rpg.cmd
```

也可以直接双击：

```txt
index.html
```

## 三种快捷更新

桌面和项目文件夹里都有这三个快捷脚本：

```txt
一键只更新系统_PLAN_RPG.cmd
一键只同步数据_PLAN_RPG.cmd
一键更新系统并同步数据_PLAN_RPG.cmd
```

使用场景：

```txt
只更新系统
```

从 GitHub 拉取最新代码，然后打开 `index.html`。不会上传你的本地记录。

```txt
只同步数据
```

把你刚从网页导出的最新 `plan-rpg-backup-*.json` 复制到 `data/plan-rpg-data.json`，提交并推送到 GitHub。不会更新系统代码。

```txt
更新系统并同步数据
```

先从 GitHub 拉取最新系统代码，再同步最新导出的数据，然后打开网页。

注意：浏览器 localStorage 不能被 `.cmd` 直接读取。同步数据前请先在网页左侧点击：

```txt
备份/迁移 -> 导出数据
```

脚本会自动寻找 Downloads 文件夹里最新的 `plan-rpg-backup-*.json`。

## 在线网页 / GitHub Pages

这个项目可以直接用 GitHub Pages 发布，因为主程序就是仓库根目录的 `index.html`。

推荐发布设置：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

发布后网址通常是：

```txt
https://p380294249-spec.github.io/plan-rpg/
```

注意：GitHub Pages 上的网页本身是公开入口。真实业务数据不要写死在 `index.html` 里；后续建议把 INSO 客户、订单、报价、维护记录等数据接到 Google Sheet。

## Google Sheet 数据层

地图系统的共享数据层已经开始搭建：

```txt
Plan RPG Map Data - Imported 2026-05-14
https://docs.google.com/spreadsheets/d/1Yz-RswNvBxJ9GFWfcU2KDAFh23NCWLS-HS2_g_07rAg/edit
```

模块说明在：

```txt
docs/data-modules.md
```

后续让 AI 修改数据同步逻辑时，先让它读 `docs/data-modules.md`，再按模块改，不需要一上来读取整个 `index.html`。

### 专注记录自动同步

当前网页已支持打开时自动读取 Google Sheet 的 `Session_Logs`，并在完成专注后自动写入 `Session_Logs`。

需要先部署 Apps Script：

```txt
google-apps-script/Code.gs
```

部署后，把 Web App URL 和同一个 token 填到网页左侧 `Google Sheet 同步` 区域。更新 Apps Script 后，需要重新点一次 `部署`，网页里的 `拉取记录` 才能读到表格。

注意：GitHub Pages 是静态公开网页，Apps Script URL 和 token 属于轻量保护，不适合直接同步敏感客户资料。当前阶段只用于地图系统的专注记录。

## 重要：数据保存在哪里

代码文件在项目目录里。

你的实际使用数据，包括 Session Log、编辑后的日志、技能 XP，默认保存在浏览器的 `localStorage` 里。配置 Google Sheet 同步后，专注记录会写入 Google Sheet，并在其他电脑打开网页时拉回本机显示。

所以换电脑前一定要：

1. 打开软件。
2. 点击左侧 `备份/迁移` 里的 `导出数据`。
3. 保存生成的 `plan-rpg-backup-YYYY-MM-DD.json`。
4. 到新电脑打开软件后，点击 `导入数据`。

## GitHub 使用流程

第一次上传：

```bash
git init
git add .
git commit -m "initial plan rpg local web app"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

另一台电脑下载：

```bash
git clone https://github.com/YOUR_NAME/YOUR_REPO.git
cd YOUR_REPO
```

以后更新：

```txt
双击 update_from_github.cmd
```

## 一键备份

双击：

```txt
backup_project.cmd
```

它会备份项目文件到：

```txt
backups/YYYY-MM-DD_HH-MM-SS/
```

注意：这个脚本备份的是项目代码，不会自动备份浏览器 localStorage。个人日志请用网页里的 `导出数据`。

## 标注规则

后续修改时请同步更新：

- `VERSION.md`：记录版本、日期、改了什么、已知问题、下一步。
- `README.md`：如果使用方式变了，要同步更新。
- `index.html` 顶部显示的版本号。

建议版本号：

- `v0.2.x`：小修小补。
- `v0.3.0`：新增导出/导入、复盘、技能系统等重要功能。
- `v1.0.0`：稳定可长期使用。

## 下一步建议

- 做一个真正的 `导入/导出备份管理页`。
- 增加 JSON 数据文件模式，减少 localStorage 迁移成本。
- 转成 Next.js + TypeScript 项目。
- 接 Supabase / PostgreSQL。
- 加 PWA 手机端。

## v0.3 新增

- `+ 突发任务`：把临时事件收编为 main / side / maintenance / noise，并进入 GMN 统计。
- `任务转向`：支持 Rename、暂停 A 创建 B、把 A 结算为 Discovery 再创建 B。
- Weekly Review 会统计突发任务、任务转向、维护和噪音。
- 地图改为四层：2030 人生九宫格 → 2026 年度战役 → Weekly Quest → 20min Task。
- 地图节点用颜色和 badge 区分 Main / Side / Maintenance / Noise / Emergency / Pivot，并显示 G/M/N 时间质量。

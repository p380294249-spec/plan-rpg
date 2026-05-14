# Plan RPG / 计划 RPG

本项目是一个本地网页软件 MVP，用来把年度计划、每周计划、主线任务、支线任务、20 分钟专注、执行日志、奖励、技能成长和每周复盘串成一个游戏化系统。

当前版本：`v0.3.10`

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

## 重要：数据保存在哪里

代码文件在项目目录里。

你的实际使用数据，包括 Session Log、编辑后的日志、技能 XP，保存在浏览器的 `localStorage` 里。它不会自动进入 GitHub。

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

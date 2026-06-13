# 2026 世界杯观赛助手

## 项目简介

一个使用原生 HTML、CSS 和 JavaScript 开发的世界杯观赛工具。用户可以查看 2026 世界杯赛程、按条件筛选比赛、关注球队、收藏比赛，并根据完场比分自动查看小组积分榜。

## 线上访问

- 网站：[https://world-cup-assistant-two.vercel.app/](https://world-cup-assistant-two.vercel.app/)
- 数据接口：[https://world-cup-assistant-two.vercel.app/api/matches](https://world-cup-assistant-two.vercel.app/api/matches)
- 比赛数据：[https://world-cup-assistant-two.vercel.app/data/matches.json](https://world-cup-assistant-two.vercel.app/data/matches.json)

## 项目截图

### 首页

> 截图待补充：`docs/screenshots/home.png`

### 赛程卡片

> 截图待补充：`docs/screenshots/matches.png`

### 积分榜

> 截图待补充：`docs/screenshots/standings.png`

### 我的关注

> 截图待补充：`docs/screenshots/favorites.png`

## 核心功能

- 查看 2026 世界杯赛程，并按北京时间和日期分组展示。
- 显示数据来源、数据更新时间、比赛总数和下一场比赛。
- 按球队、小组和比赛状态筛选赛程。
- 一键清除筛选，或只查看已关注球队的比赛。
- 关注球队和收藏比赛。
- 使用浏览器 `localStorage` 保存关注与收藏，刷新后不会丢失。
- 根据已结束且有比分的比赛自动计算小组积分榜。
- 通过 `/api/matches` 提供稳定的比赛数据接口。
- API 不可用时自动回退到 `data/matches.json`。
- 使用 OpenFootball 公共数据源更新赛程。
- 使用 GitHub Actions 每天自动更新数据。
- GitHub 产生新提交后由 Vercel 自动部署。
- 支持电脑和手机浏览，移动端积分榜可横向滚动。

## 技术栈

- HTML
- CSS
- JavaScript
- JSON
- Node.js
- Vercel
- GitHub Actions
- OpenFootball

项目没有使用 React、Vue、Next.js、数据库或用户登录系统。

## 项目结构

当前 Git 仓库根目录位于网页项目的上一层，实际结构如下：

```text
repository-root/
├── .github/
│   └── workflows/
│       └── update-matches.yml
└── world-cup-assistant/
    ├── api/
    │   └── matches.js
    ├── data/
    │   ├── matches.json
    │   └── teams.json
    ├── docs/
    │   └── screenshots/
    ├── scripts/
    │   ├── fetch-matches.js
    │   └── match-normalizer.js
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── README.md
    ├── script.js
    ├── style.css
    └── vercel.json
```

主要文件作用：

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构和各功能区域 |
| `style.css` | 页面样式、卡片布局和移动端适配 |
| `script.js` | 数据加载、筛选、关注、收藏和积分榜计算 |
| `data/matches.json` | 前端和 API 读取的比赛数据 |
| `data/teams.json` | 球队中文名、英文名、小组和别名映射 |
| `api/matches.js` | Vercel Serverless API，读取本地比赛 JSON |
| `scripts/fetch-matches.js` | 从 OpenFootball 下载并安全更新比赛数据 |
| `scripts/match-normalizer.js` | 转换时间、球队、小组、比分和状态 |
| `.github/workflows/update-matches.yml` | 定时更新数据并在变化时提交 |
| `vercel.json` | Vercel 静态项目配置 |

## 数据来源

项目使用 OpenFootball 的 2026 世界杯公开 JSON：

```text
https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
```

- 当前方案不依赖 API Key。
- OpenFootball 不是实时比分服务，数据由社区维护，可能存在延迟或调整。
- 更新脚本会将原始数据转换成项目使用的 `data/matches.json` 格式。
- 球队中文名和常见别名优先从 `data/teams.json` 匹配。
- 如果请求失败、返回空数据或转换失败，脚本不会覆盖已有的 `matches.json`。

## 本地运行

在终端运行：

```bash
cd "/Users/jasonwang/Documents/world  cup/world-cup-assistant"
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

使用普通静态服务器时，本地没有 `/api/matches`，前端会自动读取 `data/matches.json`。

## 数据更新

确认电脑已经安装 Node.js，然后在项目目录运行：

```bash
npm install
npm run fetch:matches
```

脚本会：

1. 请求 OpenFootball 2026 世界杯 JSON。
2. 转换时间、球队名称、小组、状态和比分。
3. 只有成功得到有效比赛数组时才更新 `data/matches.json`。
4. 输出请求状态、比赛数量和保存结果。

可以使用以下命令检查数据变化：

```bash
git diff -- data/matches.json
```

## GitHub Actions 自动更新

workflow 文件位于仓库根目录：

```text
.github/workflows/update-matches.yml
```

- 每天北京时间上午 9 点自动运行，对应 UTC 01:00。
- 支持在 GitHub 仓库的 **Actions** 页面手动运行。
- workflow 会进入 `world-cup-assistant` 目录，执行 `npm install` 和 `npm run fetch:matches`。
- 只有 `data/matches.json` 发生变化时才会自动提交并推送。
- 没有数据变化时不会产生空 commit。

手动运行方法：

1. 打开 GitHub 仓库的 **Actions** 页面。
2. 选择 **Update World Cup Matches**。
3. 点击 **Run workflow**。
4. 选择 `main` 分支并确认。

## Vercel 部署

项目已部署到 Vercel，并与 GitHub 仓库连接：

[https://world-cup-assistant-two.vercel.app/](https://world-cup-assistant-two.vercel.app/)

部署流程：

1. 将代码推送到 GitHub。
2. Vercel 检测到新 commit。
3. Vercel 自动创建新部署。
4. 部署完成后检查首页、`/api/matches` 和静态 JSON。

首次导入项目时，在 Vercel 将 Root Directory 设置为 `world-cup-assistant`，Framework Preset 使用 **Other**，无需复杂构建命令。

## 安全说明

- OpenFootball 方案不需要 API Key。
- `.env` 不应提交到 GitHub。
- `.gitignore` 保留 `.env` 和 `node_modules`。
- 不要把密码、Token、API Key 或其他敏感信息写入前端代码、workflow 或 README。
- `/api/matches` 只返回比赛数据，不返回环境变量或敏感信息。

## 项目阶段

- 第一阶段：基础页面和模拟数据
- 第二阶段：数据更新脚本
- 第三阶段：Vercel 静态部署
- 第四阶段：`/api/matches` 接口与本地 JSON 回退
- 第五阶段：OpenFootball 自动更新数据
- 第六阶段：页面体验优化
- 第七阶段：项目收尾与作品包装

## 后续可优化方向

以下方向仅作为后续规划，本阶段不实现：

- 增加国旗图标
- 增加比赛日历视图
- 增加球队详情页
- 增加比赛提醒
- 增加更完整的淘汰赛视图
- 增加移动端 PWA
- 增加多语言切换

## 最终验收清单

- [ ] 首页可访问
- [ ] `/api/matches` 可访问
- [ ] `data/matches.json` 可访问
- [ ] 比赛卡片正常显示
- [ ] 球队筛选正常
- [ ] 小组筛选正常
- [ ] 状态筛选正常
- [ ] 关注球队正常
- [ ] 收藏比赛正常
- [ ] 刷新后关注和收藏仍然保留
- [ ] 积分榜正常
- [ ] GitHub Actions 可运行
- [ ] Vercel 可自动部署
- [ ] 浏览器控制台无红色错误
- [ ] 未发现 API Key 泄露

## 许可与说明

本项目用于学习和作品展示。世界杯赛程数据来自 OpenFootball；使用和再发布数据时，请同时遵守其项目许可与数据说明。

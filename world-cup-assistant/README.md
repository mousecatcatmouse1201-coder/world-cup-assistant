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
    ├── dist-cn/
    │   ├── data/
    │   │   ├── matches.json
    │   │   └── teams.json
    │   ├── index.html
    │   ├── script.js
    │   └── style.css
    ├── scripts/
    │   ├── build-cn.js
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
| `scripts/build-cn.js` | 生成不依赖 Vercel API 的国内静态镜像 |
| `scripts/fetch-matches.js` | 从 OpenFootball 下载并安全更新比赛数据 |
| `scripts/match-normalizer.js` | 转换时间、球队、小组、比分和状态 |
| `dist-cn/` | 可直接上传到国内静态托管平台的发布目录 |
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

## 中国大陆访问方案

Vercel 的 `.vercel.app` 域名在中国大陆可能访问不稳定，国内朋友使用手机时可能无法顺利打开。因此，项目同时提供一个可部署到国内静态托管平台的纯静态镜像版本。

国内静态镜像版具有以下特点：

- 只使用 HTML、CSS、JavaScript 和本地 JSON。
- 不依赖 Vercel。
- 不请求 `/api/matches`。
- 不需要 API Key。
- 不直接请求 OpenFootball 或其他外部实时接口。

在项目根目录生成国内静态镜像：

```bash
npm run build:cn
```

生成结果位于：

```text
dist-cn/
├── index.html
├── style.css
├── script.js
└── data/
    ├── matches.json
    └── teams.json
```

本地测试方式：

```bash
cd dist-cn
python3 -m http.server 8001
```

然后访问：

```text
http://localhost:8001
```

可以选择以下国内静态托管平台：

- 腾讯云 CloudBase 静态网站托管
- 腾讯云 COS 静态网站
- 阿里云 OSS 静态网站
- 其他国内静态网页托管服务

部署时，将 `dist-cn/` **里面的内容**上传到平台的网站根目录，不要把 `dist-cn` 文件夹本身再套一层上传。需要上传的文件为：

```text
dist-cn/index.html
dist-cn/style.css
dist-cn/script.js
dist-cn/data/matches.json
dist-cn/data/teams.json
```

上传完成后访问平台提供的网站地址，也可以将该地址生成二维码，供朋友直接使用手机打开。

## 国内静态镜像上线步骤

`http://localhost:8001` 只能在运行本地服务器的 Mac 上访问，不能作为链接发给朋友。要让朋友通过手机访问，必须把 `dist-cn/` 中的静态文件上传到公网静态托管平台。

推荐使用腾讯云 CloudBase 静态网站托管。文件上传成功后，CloudBase 会提供一个公网访问地址。最终发给朋友的是这个腾讯云地址，不是 `http://localhost:8001`，也不是 Vercel 地址。

### 需要上传的文件

上传 `dist-cn/` **里面的内容**：

```text
index.html
style.css
script.js
data/
  matches.json
  teams.json
```

注意：

- 上传的是 `dist-cn/` 里面的内容。
- 不要上传整个项目文件夹。
- 不要上传 `world-cup-assistant/`。
- 不要把 `dist-cn` 文件夹本身作为网站根目录的下一层上传。
- 上传完成后，托管平台的网站根目录中应该直接看到 `index.html`。

以下开发文件和目录不需要上传：

```text
api/
scripts/
.github/
.env
node_modules/
package.json
README.md
```

### 腾讯云 CloudBase 静态托管步骤

1. 登录腾讯云。
2. 进入 **CloudBase 云开发**。
3. 创建一个环境。
4. 打开“静态网站托管”。
5. 开通静态网站托管。
6. 进入文件管理。
7. 上传 `dist-cn/` 里面的所有内容。
8. 确认根目录下存在 `index.html`。
9. 确认根目录下存在 `style.css`、`script.js` 和 `data/` 文件夹。
10. 获取 CloudBase 提供的公网访问地址。
11. 关闭手机 Wi-Fi，使用 4G 或 5G 打开该地址测试。
12. 测试通过后，把 CloudBase 公网访问地址发给朋友。

### 发给朋友前的手机测试清单

- [ ] 首页可以打开。
- [ ] 比赛卡片正常显示。
- [ ] 球队筛选正常。
- [ ] 小组筛选正常。
- [ ] 状态筛选正常。
- [ ] 关注球队正常。
- [ ] 收藏比赛正常。
- [ ] 刷新后关注和收藏仍然保留。
- [ ] 积分榜正常。
- [ ] 页面没有明显错位。
- [ ] 手机浏览器控制台无法方便查看时，至少确认页面没有空白和明显报错。

### 可以发给朋友的话术

```text
这是我做的世界杯观赛助手网页，手机浏览器打开即可：

https://你的国内静态托管地址
```

请将示例地址替换为腾讯云 CloudBase 实际生成的公网地址。不要写成 `http://localhost:8001`，也不要使用 Vercel 地址，因为国内朋友可能无法稳定访问。

### 国内镜像的限制

- 国内镜像是纯静态版本。
- 不依赖 `/api/matches`。
- 不依赖 Vercel。
- 不依赖 API Key。
- 不会在用户访问页面时实时请求 OpenFootball。
- 页面展示的是运行 `npm run build:cn` 时复制到 `dist-cn/data/matches.json` 的数据。
- 本地数据更新后，已经上传到 CloudBase 的旧文件不会自动更新，需要重新构建并上传。

### 国内镜像数据更新流程

如果以后 `data/matches.json` 更新了，在项目目录重新运行：

```bash
npm run fetch:matches
npm run build:cn
```

然后把新的 `dist-cn/` 内容重新上传到腾讯云 CloudBase，覆盖原有静态文件。上传后再次使用手机检查比赛数量和页面功能。

## 国内静态镜像自动同步

GitHub Actions 会每天运行现有的 `.github/workflows/update-matches.yml`，完成以下流程：

1. 安装项目依赖。
2. 运行 `npm run fetch:matches` 更新 OpenFootball 比赛数据。
3. 运行 `npm run build:cn` 重新生成 `dist-cn/`。
4. 只有 `data/matches.json` 发生变化时才创建并推送 Git commit。
5. 使用腾讯云官方 `@cloudbase/cli` 将 `dist-cn/` 上传到 CloudBase 的 `world-cup-assistant-cn/` 路径。
6. 即使比赛数据没有变化，workflow 也会重新部署当前镜像，确保线上静态文件与仓库代码一致。

如果 OpenFootball 临时请求失败，更新脚本不会覆盖原有比赛数据；workflow 会验证现有 `data/matches.json`，数据有效时继续构建和部署，数据无效时停止执行。

自动部署使用腾讯云官方命令：

```bash
tcb login --apiKeyId "$TCB_SECRET_ID" --apiKey "$TCB_SECRET_KEY"
tcb hosting deploy ./world-cup-assistant/dist-cn /world-cup-assistant-cn -e "$TCB_ENV_ID"
```

凭证只存放在 GitHub Secrets 中，不要将真实值写入 workflow、README、`.env` 或前端代码。

### 配置 GitHub Secrets

打开 GitHub 仓库：

```text
Settings → Secrets and variables → Actions → New repository secret
```

添加以下三个 Repository secrets：

| Secret 名称 | 内容 |
| --- | --- |
| `TCB_SECRET_ID` | 腾讯云访问密钥的 SecretId |
| `TCB_SECRET_KEY` | 腾讯云访问密钥的 SecretKey |
| `TCB_ENV_ID` | 当前 CloudBase 环境 ID |

`TCB_ENV_ID` 应填写 CloudBase 控制台中显示的真实环境 ID。不要填写环境名称、访问域名或示例占位符。

建议为自动部署创建权限尽量小的腾讯云 CAM 子账号或专用密钥，并只授予该 CloudBase 环境静态托管所需的权限。

### 手动触发自动部署

1. 打开 GitHub 仓库的 **Actions** 页面。
2. 选择 **Update World Cup Matches**。
3. 点击 **Run workflow**。
4. 选择 `main` 分支。
5. 点击绿色的 **Run workflow** 按钮。
6. 打开本次运行记录，逐步检查构建、登录和部署日志。

运行成功时，以下步骤应显示绿色：

- `Fetch latest matches`
- `Build China static mirror`
- `Commit updated matches`
- `Install CloudBase CLI`
- `Check CloudBase deployment secrets`
- `Log in to CloudBase`
- `Deploy China static mirror`

如果比赛数据没有变化，日志会显示“不创建提交”，这不是错误，CloudBase 部署仍会继续执行。

### 检查自动部署结果

国内静态镜像地址：

[https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/](https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/)

部署完成后检查：

```text
https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/
https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/style.css
https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/script.js
https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/data/matches.json
https://world-cup-assistant-d2bce74d546c-1443033455.tcloudbaseapp.com/world-cup-assistant-cn/data/teams.json
```

同时检查：

- GitHub Actions 本次运行是否成功。
- 数据变化时，仓库是否出现自动更新 commit。
- GitHub push 后，Vercel 是否出现新的部署记录。
- 国内页面的比赛数量和 `data/matches.json` 是否与本地最新数据一致。

自动部署失败时，CloudBase 现有线上文件不会被 workflow 主动删除。可以先查看失败步骤；需要临时恢复时，仍可在本地运行 `npm run build:cn`，然后手动上传 `dist-cn/` 中的内容。

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
- 第八阶段：中国大陆静态镜像部署
- 第九阶段：国内静态镜像上线说明
- 第十阶段：国内静态镜像自动同步

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

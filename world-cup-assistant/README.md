# 2026 世界杯观赛助手

这是一个适合初学者阅读和修改的纯前端项目。第一阶段只使用 HTML、CSS、JavaScript、本地 JSON 和浏览器 `localStorage`。

> 注意：项目中的球队分组、比赛时间、场地和比分均为学习用模拟数据，不代表真实赛程。

## 项目文件

```text
world-cup-assistant/
├── .env.example        API 环境变量示例
├── .gitignore          Git 忽略规则
├── index.html          页面结构和主要区域
├── package.json        Node.js 项目配置和脚本命令
├── style.css           页面样式和手机端适配
├── script.js           数据加载、筛选、收藏、关注和积分榜计算
├── scripts/
│   └── fetch-matches.js 从 API 获取并转换世界杯赛程
├── data/
│   ├── matches.json    模拟比赛数据
│   └── teams.json      球队中英文名称和小组数据
└── README.md           项目说明和测试方法
```

## 如何打开

### 方法一：直接打开

双击 `index.html`，浏览器会直接显示页面。由于部分浏览器不允许 `file://` 页面读取 JSON，项目准备了与 JSON 相同的备用模拟数据，确保直接打开也能使用。

### 方法二：使用本地服务器（推荐）

在项目目录打开终端，运行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

使用这个方法时，页面会通过 `fetch` 正常读取 `data/matches.json` 和 `data/teams.json`。

## 测试清单

1. 页面顶部能看到“2026 世界杯观赛助手”。
2. “全部赛程”区域能看到 12 张比赛卡片。
3. 分别使用球队、小组、比赛状态筛选，比赛数量会随之变化。
4. 在“我的关注”中点击一个球队，首页会优先显示该球队的比赛。
5. 在比赛卡片中点击“收藏比赛”，该比赛会出现在“收藏比赛”区域。
6. 刷新页面，关注球队和收藏比赛仍然存在。
7. 查看小组积分榜，已结束比赛会自动计入场次、进球和积分。

## 数据说明

- 比赛时间存储为带时区的 ISO 日期字符串。
- 页面使用 `Asia/Shanghai` 时区统一转换为北京时间。
- 只有 `status` 为 `finished` 且比分存在的比赛会计入积分榜。
- 积分排序依次比较：积分、净胜球、进球数。

## 第二阶段：更新赛程数据

更新脚本会请求 API-FOOTBALL 的 2026 世界杯赛程，并将结果转换成网页可以直接读取的 `data/matches.json` 格式。

### 1. 安装依赖

先确认电脑已经安装 Node.js，然后在项目目录运行：

```bash
npm install
```

当前脚本只使用 Node.js 内置功能，没有额外的第三方依赖。运行 `npm install` 仍可帮助你确认 Node.js 项目配置正常。

### 2. 创建 `.env`

复制环境变量示例文件：

```bash
cp .env.example .env
```

然后打开 `.env`，把 `your_api_key_here` 替换为你在 API-SPORTS 后台获得的 API Key：

```text
API_FOOTBALL_KEY=你的真实_API_Key
API_FOOTBALL_HOST=v3.football.api-sports.io
```

`.env` 已加入 `.gitignore`，不会被 Git 提交。不要把真实 API Key 写进 JavaScript 文件或分享给其他人。

### 3. 更新比赛数据

运行：

```bash
npm run fetch:matches
```

成功时，终端会显示请求成功、转换比赛数量以及保存路径。重新启动本地服务器或刷新网页后，即可读取更新后的赛程。

### 4. 请求失败时

如果 API Key 缺失、请求失败、API 返回错误或比赛数据为空，脚本会输出失败原因，并保留原来的 `data/matches.json`，不会用空数据覆盖它。

即使没有 API Key，网页仍然可以读取现有的本地 JSON 数据并正常使用。

常见检查方法：

1. 确认 `.env` 文件位于项目根目录。
2. 确认 `API_FOOTBALL_KEY` 没有多余空格或引号。
3. 确认网络连接正常，并检查 API-SPORTS 账户的请求额度。
4. 再次运行 `npm run fetch:matches`。

## 第三阶段：Vercel 部署说明

当前项目是静态 HTML、CSS 和 JavaScript 网站，不需要构建框架或数据库。`vercel.json` 只启用了简洁 URL，不会改变 `data/matches.json` 和 `data/teams.json` 的相对路径。

### 本地运行

在项目根目录运行：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

### 更新赛程数据

如果已经创建 `.env` 并填写了有效 API Key，可以运行：

```bash
npm run fetch:matches
```

没有 API Key 时不要运行更新命令，网页仍会使用现有的 `data/matches.json`。

### 部署前检查

1. 确认 `.env` 已被 `.gitignore` 忽略，不会上传到 GitHub。
2. 确认 `data/matches.json` 和 `data/teams.json` 存在。
3. 使用本地服务器打开网页，确认所有功能正常。
4. 检查浏览器控制台，确认没有错误或警告。

### 上传到 GitHub

在项目根目录依次运行：

```bash
git init
git add .
git commit -m "Prepare world cup assistant for Vercel"
git branch -M main
git remote add origin 你的_GitHub_仓库地址
git push -u origin main
```

提交前可以运行 `git status`，确认列表中没有 `.env`。

### 在 Vercel 部署

1. 登录 Vercel。
2. 点击 **Add New Project**，然后选择 **Import Git Repository**。
3. 选择刚刚上传的 GitHub 仓库。
4. Framework Preset 选择 **Other**，或保持默认静态项目设置。
5. Build Command 留空或保持默认。
6. Output Directory 留空或保持默认。
7. 点击 **Deploy**。

如果 GitHub 仓库只包含 `world-cup-assistant` 项目，Root Directory 保持默认即可。如果仓库外层还包含其他目录，请将 Root Directory 设置为 `world-cup-assistant`。

### 部署后验收

1. 首页可以正常打开。
2. 比赛卡片可以正常显示。
3. 球队筛选可以使用。
4. 小组筛选可以使用。
5. 比赛状态筛选可以使用。
6. 关注球队可以保存。
7. 收藏比赛可以保存。
8. 刷新页面后，关注球队和收藏比赛不会丢失。
9. 小组积分榜显示正常。
10. 浏览器控制台没有错误或警告。

## 第四阶段：Vercel API 接口

项目新增了 `/api/matches` Serverless API。前端会优先请求这个接口获取赛程；如果接口不可用，则自动读取 `data/matches.json`，因此普通静态预览仍然可以正常使用。

### 接口返回内容

访问：

```text
https://你的域名/api/matches
```

接口会返回：

```json
{
  "source": "api",
  "updatedAt": "2026-06-12T12:00:00.000Z",
  "count": 104,
  "matches": []
}
```

查看 `source` 可以判断数据来源：

- `api`：数据来自 API-FOOTBALL。
- `local-fallback`：未配置 API Key、第三方请求失败或数据异常，接口使用了本地 `data/matches.json`。

只有本地 JSON 也无法读取时，接口才会返回 HTTP 500。

### 在 Vercel 配置环境变量

1. 打开 Vercel 项目。
2. 进入 **Settings → Environment Variables**。
3. 添加 `API_FOOTBALL_KEY`，值为你的真实 API Key。
4. 添加 `API_FOOTBALL_HOST`，值为 `v3.football.api-sports.io`。
5. 保存后重新部署项目。

API Key 只保存在 Vercel 环境变量中。不要把它写入前端、README、`.env.example` 或 GitHub 仓库。

### 本地测试

使用普通静态服务器：

```bash
python3 -m http.server 8000
```

本地没有 `/api/matches` 时，前端会自动回退到 `data/matches.json`。

如果安装了 Vercel CLI，也可以运行：

```bash
vercel dev
```

然后访问本地的 `/api/matches` 检查 Serverless API。

## 第五阶段：自动更新赛程数据

项目使用 GitHub Actions 每天自动运行数据更新脚本。workflow 文件位于仓库根目录：

```text
.github/workflows/update-matches.yml
```

它会在每天北京时间上午 9 点运行一次，对应 GitHub Actions 使用的 UTC 时间上午 1 点。也可以在 GitHub 页面手动运行。

### 配置 GitHub Secrets

1. 打开 GitHub 仓库。
2. 进入 **Settings → Secrets and variables → Actions**。
3. 点击 **New repository secret**。
4. 添加 `API_FOOTBALL_KEY`，值为真实 API Key。
5. 添加 `API_FOOTBALL_HOST`，值为 `v3.football.api-sports.io`。

不要把真实 API Key 写入 workflow、README、前端代码或提交到 GitHub。

### 手动运行 workflow

1. 打开 GitHub 仓库的 **Actions** 页面。
2. 选择 **Update World Cup Matches**。
3. 点击 **Run workflow**。
4. 选择 `main` 分支并确认运行。

workflow 会进入 `world-cup-assistant` 目录，运行：

```bash
npm install
npm run fetch:matches
```

如果 `data/matches.json` 有变化，GitHub Actions 会自动创建并推送以下提交：

```text
chore: update world cup matches data
```

如果数据没有变化，则不会创建空提交。如果 API 请求失败、Key 缺失或返回数据为空，`fetch-matches.js` 会保留现有的 `data/matches.json`，并让本次 workflow 显示失败，便于检查原因。

### 查看运行和部署结果

在 GitHub 仓库的 **Actions** 页面可以查看每次运行状态和各步骤日志。成功更新后，可以在仓库提交记录中确认自动提交，并打开 `data/matches.json` 检查内容。

Vercel 已连接 GitHub。自动提交推送到 GitHub 后，会触发新的 Vercel 部署。可以进入 Vercel 项目的 **Deployments** 页面，确认最新部署关联了自动更新提交，并在部署完成后访问线上首页和 `/api/matches` 验收数据。

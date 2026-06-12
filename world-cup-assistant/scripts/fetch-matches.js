import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(SCRIPT_DIR, "..");
const ENV_PATH = join(PROJECT_DIR, ".env");
const TEAMS_PATH = join(PROJECT_DIR, "data", "teams.json");
const MATCHES_PATH = join(PROJECT_DIR, "data", "matches.json");

const NOT_STARTED_STATUSES = new Set(["NS", "TBD", "PST", "CANC", "ABD"]);
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

export async function loadEnv(filePath = ENV_PATH) {
  let content;

  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }

  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line
          .slice(separatorIndex + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [key, value];
      })
  );
}

export function convertStatus(statusShort) {
  const status = String(statusShort || "").toUpperCase();

  if (NOT_STARTED_STATUSES.has(status)) return "not_started";
  if (LIVE_STATUSES.has(status)) return "live";
  if (FINISHED_STATUSES.has(status)) return "finished";
  return "not_started";
}

export function extractGroup(round) {
  const roundText = String(round || "");
  const match = roundText.match(/\bgroup(?:\s+stage)?\s*[-:]?\s*([A-Z])\b/i);
  return match ? match[1].toUpperCase() : "Unknown";
}

export function convertFixtures(fixtures, teams) {
  const chineseNames = new Map(
    teams.map((team) => [team.name, team.nameZh || team.name])
  );

  return fixtures
    .filter((item) => item?.fixture && item?.teams?.home && item?.teams?.away)
    .map((item, index) => {
      const homeTeam = item.teams.home.name || "Unknown";
      const awayTeam = item.teams.away.name || "Unknown";
      const fixtureId = item.fixture.id ?? String(index + 1).padStart(3, "0");

      return {
        id: `match-${fixtureId}`,
        group: extractGroup(item.league?.round),
        homeTeam,
        awayTeam,
        homeTeamZh: chineseNames.get(homeTeam) || homeTeam,
        awayTeamZh: chineseNames.get(awayTeam) || awayTeam,
        date: item.fixture.date || "",
        stadium: item.fixture.venue?.name || "Unknown",
        city: item.fixture.venue?.city || "Unknown",
        status: convertStatus(item.fixture.status?.short),
        homeScore: item.goals?.home ?? null,
        awayScore: item.goals?.away ?? null
      };
    });
}

function getApiErrorMessage(data) {
  if (!data?.errors) return "";
  if (Array.isArray(data.errors)) return data.errors.filter(Boolean).join("; ");
  if (typeof data.errors === "object") {
    return Object.values(data.errors).filter(Boolean).join("; ");
  }
  return String(data.errors);
}

async function saveMatchesSafely(matches, outputPath = MATCHES_PATH) {
  const tempPath = `${outputPath}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(matches, null, 2)}\n`, "utf8");

  try {
    await rename(tempPath, outputPath);
  } catch (error) {
    await unlink(tempPath).catch(() => {});
    throw error;
  }
}

export async function fetchAndSaveMatches({
  fetchImpl = fetch,
  environment = process.env,
  envPath = ENV_PATH,
  teamsPath = TEAMS_PATH,
  outputPath = MATCHES_PATH,
  logger = console
} = {}) {
  try {
    const fileEnv = await loadEnv(envPath);
    const apiKey = environment.API_FOOTBALL_KEY || fileEnv.API_FOOTBALL_KEY;
    const apiHost =
      environment.API_FOOTBALL_HOST ||
      fileEnv.API_FOOTBALL_HOST ||
      "v3.football.api-sports.io";

    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error("未找到有效的 API_FOOTBALL_KEY，请先创建并填写 .env 文件。");
    }

    const teams = JSON.parse(await readFile(teamsPath, "utf8"));
    const url = new URL(`https://${apiHost}/fixtures`);
    url.searchParams.set("league", "1");
    url.searchParams.set("season", "2026");

    logger.log("正在请求 2026 世界杯赛程数据...");
    const response = await fetchImpl(url, {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`API 返回 HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const apiError = getApiErrorMessage(data);
    if (apiError) {
      throw new Error(`API 返回错误：${apiError}`);
    }

    if (!Array.isArray(data.response) || data.response.length === 0) {
      throw new Error("API 返回的比赛数据为空，现有 matches.json 保持不变。");
    }

    logger.log(`请求成功，共收到 ${data.response.length} 场比赛。`);
    const matches = convertFixtures(data.response, teams);

    if (matches.length === 0) {
      throw new Error("没有可转换的比赛数据，现有 matches.json 保持不变。");
    }

    logger.log(`转换了 ${matches.length} 场比赛。`);
    await saveMatchesSafely(matches, outputPath);
    logger.log(`已保存到 ${outputPath}`);
    return matches;
  } catch (error) {
    logger.error(`请求失败：${error.message}`);
    return null;
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const result = await fetchAndSaveMatches();
  if (!result) process.exitCode = 1;
}

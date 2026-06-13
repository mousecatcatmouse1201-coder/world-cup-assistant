import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { convertOpenFootballMatches } from "./match-normalizer.js";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(SCRIPT_DIR, "..");
const TEAMS_PATH = join(PROJECT_DIR, "data", "teams.json");
const MATCHES_PATH = join(PROJECT_DIR, "data", "matches.json");
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

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
  sourceUrl = OPENFOOTBALL_URL,
  teamsPath = TEAMS_PATH,
  outputPath = MATCHES_PATH,
  logger = console
} = {}) {
  try {
    const teams = JSON.parse(await readFile(teamsPath, "utf8"));
    if (!Array.isArray(teams)) {
      throw new Error("teams.json 格式异常");
    }

    logger.log("正在请求 OpenFootball 2026 世界杯赛程...");
    const response = await fetchImpl(sourceUrl);

    if (!response.ok) {
      throw new Error(
        `OpenFootball 返回 HTTP ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!Array.isArray(data.matches) || data.matches.length === 0) {
      throw new Error("OpenFootball 返回的比赛数据为空或格式异常");
    }

    logger.log(`请求成功，共收到 ${data.matches.length} 场比赛。`);
    const matches = convertOpenFootballMatches(data.matches, teams, { logger });

    if (matches.length === 0) {
      throw new Error("没有成功转换任何比赛，现有 matches.json 保持不变");
    }

    logger.log(`转换了 ${matches.length} 场比赛。`);
    await saveMatchesSafely(matches, outputPath);
    logger.log(`已保存到 ${outputPath}`);
    return matches;
  } catch (error) {
    logger.error(`更新失败：${error.message}`);
    logger.error("现有 data/matches.json 保持不变。");
    return null;
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const result = await fetchAndSaveMatches();
  if (!result) process.exitCode = 1;
}

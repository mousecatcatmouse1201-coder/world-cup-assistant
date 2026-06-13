import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(API_DIR, "..");
const MATCHES_PATH = join(PROJECT_DIR, "data", "matches.json");
const CACHE_CONTROL = "s-maxage=3600, stale-while-revalidate=86400";

async function loadLocalMatches() {
  const matches = JSON.parse(await readFile(MATCHES_PATH, "utf8"));
  if (!Array.isArray(matches)) {
    throw new Error("本地比赛数据格式异常");
  }
  return matches;
}

export async function createMatchesResponse({
  localMatchesLoader = loadLocalMatches
} = {}) {
  const matches = await localMatchesLoader();
  return { source: "local-json", matches };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", CACHE_CONTROL);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const result = await createMatchesResponse();
    return res.status(200).json({
      source: result.source,
      updatedAt: new Date().toISOString(),
      count: result.matches.length,
      matches: result.matches
    });
  } catch {
    return res.status(500).json({
      error: "无法读取比赛数据",
      updatedAt: new Date().toISOString()
    });
  }
}

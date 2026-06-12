import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  convertFixtures,
  getApiErrorMessage
} from "../scripts/match-normalizer.js";

const API_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = join(API_DIR, "..");
const MATCHES_PATH = join(PROJECT_DIR, "data", "matches.json");
const TEAMS_PATH = join(PROJECT_DIR, "data", "teams.json");
const CACHE_CONTROL = "s-maxage=3600, stale-while-revalidate=86400";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadLocalMatches() {
  const matches = await readJson(MATCHES_PATH);
  if (!Array.isArray(matches)) {
    throw new Error("本地比赛数据格式异常");
  }
  return matches;
}

async function requestApiMatches({ apiKey, apiHost, fetchImpl = fetch }) {
  const teams = await readJson(TEAMS_PATH);
  if (!Array.isArray(teams)) {
    throw new Error("球队数据格式异常");
  }

  const url = new URL(`https://${apiHost}/fixtures`);
  url.searchParams.set("league", "1");
  url.searchParams.set("season", "2026");

  const response = await fetchImpl(url, {
    headers: {
      "x-apisports-key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`API 返回 HTTP ${response.status}`);
  }

  const data = await response.json();
  const apiError = getApiErrorMessage(data);
  if (apiError) {
    throw new Error("API 返回错误");
  }

  if (!Array.isArray(data.response) || data.response.length === 0) {
    throw new Error("API 返回的比赛数据为空或格式异常");
  }

  const matches = convertFixtures(data.response, teams);
  if (matches.length === 0) {
    throw new Error("API 比赛数据转换失败");
  }

  return matches;
}

function sendMatches(res, source, matches) {
  return res.status(200).json({
    source,
    updatedAt: new Date().toISOString(),
    count: matches.length,
    matches
  });
}

export async function createMatchesResponse({
  apiKey = process.env.API_FOOTBALL_KEY,
  apiHost =
    process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io",
  fetchImpl = fetch,
  localMatchesLoader = loadLocalMatches
} = {}) {
  if (apiKey && apiKey !== "your_api_key_here") {
    try {
      const matches = await requestApiMatches({ apiKey, apiHost, fetchImpl });
      return { source: "api", matches };
    } catch {
      // Any upstream or conversion problem falls back to the checked-in data.
    }
  }

  const matches = await localMatchesLoader();
  return { source: "local-fallback", matches };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", CACHE_CONTROL);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const result = await createMatchesResponse();
    return sendMatches(res, result.source, result.matches);
  } catch {
    return res.status(500).json({
      error: "无法读取比赛数据",
      updatedAt: new Date().toISOString()
    });
  }
}

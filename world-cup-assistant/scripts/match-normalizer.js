const NOT_STARTED_STATUSES = new Set(["NS", "TBD", "PST", "CANC", "ABD"]);
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

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

export function getApiErrorMessage(data) {
  if (!data?.errors) return "";
  if (Array.isArray(data.errors)) return data.errors.filter(Boolean).join("; ");
  if (typeof data.errors === "object") {
    return Object.values(data.errors).filter(Boolean).join("; ");
  }
  return String(data.errors);
}

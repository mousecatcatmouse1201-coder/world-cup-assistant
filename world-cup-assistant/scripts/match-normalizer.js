function createChineseNameMap(teams) {
  return new Map(
    teams.map((team) => [team.name, team.nameZh || team.name])
  );
}

export function extractOpenFootballGroup(group, round) {
  const match = String(group || "").match(/\bGroup\s+([A-Z])\b/i);
  if (match) return match[1].toUpperCase();

  const roundText = String(round || "").toLowerCase();
  if (
    roundText.includes("final") ||
    roundText.includes("round of") ||
    roundText.includes("play-off") ||
    roundText.includes("third place")
  ) {
    return "Knockout";
  }

  return "Unknown";
}

export function parseOpenFootballDate(date, time) {
  const dateText = String(date || "").trim();
  const timeText = String(time || "").trim();
  const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!dateMatch) {
    return {
      value: dateText,
      warning: `无法识别日期“${dateText || "空"}”`
    };
  }

  const fallbackValue = `${dateText}T00:00:00.000Z`;
  const timeMatch = timeText.match(
    /^(\d{1,2}):(\d{2})(?:\s*(?:UTC)?\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?)?$/i
  );

  if (!timeMatch) {
    return {
      value: fallbackValue,
      warning: `无法识别时间“${timeText || "空"}”，已使用当天 UTC 00:00`
    };
  }

  const [, year, month, day] = dateMatch;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const offsetHour = Number(timeMatch[4] || 0);
  const offsetMinute = Number(timeMatch[5] || 0);

  if (
    hour > 23 ||
    minute > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return {
      value: fallbackValue,
      warning: `时间“${timeText}”超出有效范围，已使用当天 UTC 00:00`
    };
  }

  const offsetSign = timeMatch[3] === "-" ? -1 : 1;
  const offsetTotalMinutes =
    timeMatch[3] ? offsetSign * (offsetHour * 60 + offsetMinute) : 0;
  const utcTimestamp =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      hour,
      minute
    ) -
    offsetTotalMinutes * 60 * 1000;

  return { value: new Date(utcTimestamp).toISOString(), warning: "" };
}

export function convertOpenFootballMatches(
  matches,
  teams,
  { logger = console } = {}
) {
  const chineseNames = createChineseNameMap(teams);

  return matches.flatMap((item, index) => {
    try {
      if (!item || !item.team1 || !item.team2 || !item.date) {
        throw new Error("缺少球队或日期");
      }

      const parsedDate = parseOpenFootballDate(item.date, item.time);
      if (parsedDate.warning) {
        logger.warn(
          `比赛 ${item.num || index + 1}：${parsedDate.warning}`
        );
      }

      const fullTimeScore = item.score?.ft;
      const hasFinishedScore =
        Array.isArray(fullTimeScore) &&
        fullTimeScore.length >= 2 &&
        Number.isFinite(fullTimeScore[0]) &&
        Number.isFinite(fullTimeScore[1]);
      const matchNumber = item.num ?? index + 1;
      const id = String(matchNumber).padStart(3, "0");
      const homeTeam = String(item.team1);
      const awayTeam = String(item.team2);
      const location = String(item.ground || "Unknown");

      return [
        {
          id: `match-${id}`,
          group: extractOpenFootballGroup(item.group, item.round),
          homeTeam,
          awayTeam,
          homeTeamZh: chineseNames.get(homeTeam) || homeTeam,
          awayTeamZh: chineseNames.get(awayTeam) || awayTeam,
          date: parsedDate.value,
          stadium: location,
          city: location,
          status: hasFinishedScore ? "finished" : "not_started",
          homeScore: hasFinishedScore ? fullTimeScore[0] : null,
          awayScore: hasFinishedScore ? fullTimeScore[1] : null
        }
      ];
    } catch (error) {
      logger.warn(
        `跳过无法转换的比赛 ${item?.num || index + 1}：${error.message}`
      );
      return [];
    }
  });
}

const FALLBACK_MATCHES = [
  [1, "A", "Mexico", "South Africa", "墨西哥", "南非", "2026-06-11T19:00:00-05:00", "Estadio Azteca", "Mexico City", "finished", 2, 1],
  [2, "A", "Canada", "Japan", "加拿大", "日本", "2026-06-12T16:00:00-04:00", "BMO Field", "Toronto", "finished", 1, 1],
  [3, "B", "Argentina", "Morocco", "阿根廷", "摩洛哥", "2026-06-13T18:00:00-04:00", "MetLife Stadium", "New York/New Jersey", "finished", 3, 0],
  [4, "B", "Denmark", "Australia", "丹麦", "澳大利亚", "2026-06-14T15:00:00-05:00", "AT&T Stadium", "Dallas", "finished", 2, 2],
  [5, "C", "France", "Brazil", "法国", "巴西", "2026-06-15T19:00:00-07:00", "SoFi Stadium", "Los Angeles", "live", 1, 1],
  [6, "C", "South Korea", "United States", "韩国", "美国", "2026-06-16T20:00:00-04:00", "Mercedes-Benz Stadium", "Atlanta", "upcoming", null, null],
  [7, "A", "Japan", "Mexico", "日本", "墨西哥", "2026-06-18T18:00:00-06:00", "Estadio Akron", "Guadalajara", "upcoming", null, null],
  [8, "A", "South Africa", "Canada", "南非", "加拿大", "2026-06-19T17:00:00-07:00", "BC Place", "Vancouver", "upcoming", null, null],
  [9, "B", "Australia", "Argentina", "澳大利亚", "阿根廷", "2026-06-20T16:00:00-05:00", "NRG Stadium", "Houston", "upcoming", null, null],
  [10, "B", "Morocco", "Denmark", "摩洛哥", "丹麦", "2026-06-21T13:00:00-04:00", "Hard Rock Stadium", "Miami", "upcoming", null, null],
  [11, "C", "Brazil", "South Korea", "巴西", "韩国", "2026-06-22T18:00:00-04:00", "Lincoln Financial Field", "Philadelphia", "upcoming", null, null],
  [12, "C", "United States", "France", "美国", "法国", "2026-06-23T17:00:00-07:00", "Lumen Field", "Seattle", "upcoming", null, null]
].map((match) => ({
  id: match[0],
  group: match[1],
  homeTeam: match[2],
  awayTeam: match[3],
  homeTeamZh: match[4],
  awayTeamZh: match[5],
  date: match[6],
  stadium: match[7],
  city: match[8],
  status: match[9],
  homeScore: match[10],
  awayScore: match[11]
}));

const FALLBACK_TEAMS = [
  ["Mexico", "墨西哥", "A"],
  ["South Africa", "南非", "A"],
  ["Canada", "加拿大", "A"],
  ["Japan", "日本", "A"],
  ["Argentina", "阿根廷", "B"],
  ["Morocco", "摩洛哥", "B"],
  ["Denmark", "丹麦", "B"],
  ["Australia", "澳大利亚", "B"],
  ["France", "法国", "C"],
  ["Brazil", "巴西", "C"],
  ["South Korea", "韩国", "C"],
  ["United States", "美国", "C"]
].map(([name, nameZh, group]) => ({ name, nameZh, group }));

const STATUS_LABELS = {
  upcoming: "未开始",
  not_started: "未开始",
  live: "进行中",
  finished: "已结束"
};

const STORAGE_KEYS = {
  followedTeams: "worldCupAssistant.followedTeams",
  favoriteMatches: "worldCupAssistant.favoriteMatches"
};

const state = {
  matches: [],
  teams: [],
  followedOnly: false,
  followedTeams: readStoredArray(STORAGE_KEYS.followedTeams),
  favoriteMatches: readStoredArray(STORAGE_KEYS.favoriteMatches).map(String)
};

const elements = {
  loadingMessage: document.querySelector("#loading-message"),
  statusSource: document.querySelector("#status-source"),
  statusUpdatedAt: document.querySelector("#status-updated-at"),
  statusMatchCount: document.querySelector("#status-match-count"),
  nextMatch: document.querySelector("#next-match"),
  followedMatches: document.querySelector("#followed-matches"),
  followedMatchCount: document.querySelector("#followed-match-count"),
  allMatches: document.querySelector("#all-matches"),
  matchCount: document.querySelector("#match-count"),
  standings: document.querySelector("#standings"),
  teamList: document.querySelector("#team-list"),
  favoriteMatches: document.querySelector("#favorite-matches"),
  teamFilter: document.querySelector("#team-filter"),
  groupFilter: document.querySelector("#group-filter"),
  statusFilter: document.querySelector("#status-filter"),
  followedOnlyFilter: document.querySelector("#followed-only-filter"),
  filterSummary: document.querySelector("#filter-summary"),
  resetFilters: document.querySelector("#reset-filters"),
  dataSource: document.querySelector("#data-source"),
  errorMessage: document.querySelector("#error-message")
};

init();

async function init() {
  try {
    const [matchResult, teams] = await Promise.all([
      loadMatches(),
      loadJson("data/teams.json", FALLBACK_TEAMS)
    ]);

    state.matches = matchResult.matches;
    state.teams = mergeTeamsWithMatches(teams, state.matches);
    updateDataStatus(matchResult);
    populateFilters();
    bindEvents();
    renderAll();
    elements.loadingMessage.hidden = true;
  } catch {
    elements.loadingMessage.hidden = true;
    elements.errorMessage.hidden = false;
    elements.errorMessage.textContent = "比赛数据加载失败，请稍后再试";
  }
}

async function loadMatches() {
  const isPythonStaticPreview =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "8000";
  const shouldRequestApi =
    window.location.protocol !== "file:" && !isPythonStaticPreview;

  if (shouldRequestApi) {
    try {
      const response = await fetch("/api/matches");
      if (!response.ok) throw new Error("API 请求失败");

      const data = await response.json();
      if (!Array.isArray(data.matches)) {
        throw new Error("API 数据格式异常");
      }

      return {
        matches: data.matches,
        sourceLabel: "OpenFootball / 本地 JSON",
        updatedAt: data.updatedAt || "",
        usedFallback: false
      };
    } catch {
      // 普通静态服务器没有 /api/matches 时，继续读取本地 JSON。
    }
  }

  const matches = await loadJson("data/matches.json", FALLBACK_MATCHES);
  return {
    matches,
    sourceLabel: "OpenFootball / 本地 JSON",
    updatedAt: "",
    usedFallback: true
  };
}

async function loadJson(path, fallbackData) {
  // 浏览器直接打开 file:// 页面时可能禁止 fetch，本地备用数据保证页面仍可使用。
  if (window.location.protocol === "file:") {
    return fallbackData;
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`无法读取 ${path}`);
  }
  return response.json();
}

function readStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function mergeTeamsWithMatches(teams, matches) {
  const chineseNames = createChineseNameMap(teams);
  const teamMap = new Map();

  matches
    .filter((match) => /^[A-Z]$/.test(match.group))
    .forEach((match) => {
      [
        [match.homeTeam, match.homeTeamZh],
        [match.awayTeam, match.awayTeamZh]
      ].forEach(([name, nameZh]) => {
        teamMap.set(name, {
          name,
          nameZh:
            chineseNames.get(normalizeTeamName(name)) ||
            normalizeChineseName(name, nameZh),
          group: match.group
        });
      });
    });

  return [...teamMap.values()].sort(
    (a, b) =>
      String(a.group).localeCompare(String(b.group)) ||
      a.name.localeCompare(b.name)
  );
}

function createChineseNameMap(teams) {
  const chineseNames = new Map();

  teams.forEach((team) => {
    if (!team.name || !team.nameZh) return;
    chineseNames.set(normalizeTeamName(team.name), team.nameZh);
    (team.aliases || []).forEach((alias) => {
      chineseNames.set(normalizeTeamName(alias), team.nameZh);
    });
  });

  return chineseNames;
}

function normalizeTeamName(name) {
  return String(name || "").trim().toLocaleLowerCase("en");
}

function normalizeChineseName(teamName, teamZhName) {
  const chineseName = String(teamZhName || "").trim();
  return normalizeTeamName(chineseName) === normalizeTeamName(teamName)
    ? ""
    : chineseName;
}

function formatTeamDisplayName(teamName, teamZhName) {
  const englishName = String(teamName || "").trim();
  const chineseName = normalizeChineseName(englishName, teamZhName);
  if (!englishName) return "";
  return chineseName ? `${chineseName} ${englishName}` : englishName;
}

function saveStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateDataStatus(matchResult) {
  elements.statusSource.textContent = matchResult.sourceLabel;
  elements.statusUpdatedAt.textContent = matchResult.updatedAt
    ? formatBeijingDateTime(matchResult.updatedAt)
    : "以本地文件为准";
  elements.statusMatchCount.textContent = `${matchResult.matches.length} 场`;
  elements.dataSource.textContent = matchResult.usedFallback
    ? "已使用本地缓存数据"
    : `数据来源：${matchResult.sourceLabel}`;
}

function populateFilters() {
  state.teams.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.name;
    option.textContent = formatTeamDisplayName(team.name, team.nameZh);
    elements.teamFilter.append(option);
  });

  const groups = [...new Set(state.matches.map((match) => match.group))].sort();
  groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = /^[A-Z]$/.test(group) ? `${group} 组` : group;
    elements.groupFilter.append(option);
  });
}

function bindEvents() {
  elements.teamFilter.addEventListener("change", renderMatches);
  elements.groupFilter.addEventListener("change", renderMatches);
  elements.statusFilter.addEventListener("change", renderMatches);
  elements.followedOnlyFilter.addEventListener("change", () => {
    state.followedOnly = elements.followedOnlyFilter.checked;
    renderMatches();
  });

  elements.resetFilters.addEventListener("click", () => {
    elements.teamFilter.value = "all";
    elements.groupFilter.value = "all";
    elements.statusFilter.value = "all";
    elements.followedOnlyFilter.checked = false;
    state.followedOnly = false;
    renderMatches();
  });

  document.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite-match]");
    if (favoriteButton) {
      toggleFavoriteMatch(favoriteButton.dataset.favoriteMatch);
      return;
    }

    const teamButton = event.target.closest("[data-follow-team]");
    if (teamButton) {
      toggleFollowedTeam(teamButton.dataset.followTeam);
    }
  });
}

function renderAll() {
  renderNextMatch();
  renderMatches();
  renderFollowedMatches();
  renderTeamButtons();
  renderFavoriteMatches();
  renderStandings();
}

function renderMatches() {
  const team = elements.teamFilter.value;
  const group = elements.groupFilter.value;
  const status = elements.statusFilter.value;

  const filteredMatches = state.matches.filter((match) => {
    const matchesTeam =
      team === "all" || match.homeTeam === team || match.awayTeam === team;
    const matchesGroup = group === "all" || match.group === group;
    const matchesStatus =
      status === "all" || normalizeStatus(match.status) === status;
    const matchesFollowed =
      !state.followedOnly ||
      state.followedTeams.includes(match.homeTeam) ||
      state.followedTeams.includes(match.awayTeam);
    return matchesTeam && matchesGroup && matchesStatus && matchesFollowed;
  });

  renderMatchesByDate(filteredMatches);
  elements.matchCount.textContent = `${filteredMatches.length} 场`;
  renderFilterSummary();
}

function renderFollowedMatches() {
  const matches = state.matches.filter(
    (match) =>
      state.followedTeams.includes(match.homeTeam) ||
      state.followedTeams.includes(match.awayTeam)
  );

  const emptyText =
    state.followedTeams.length === 0
      ? "你还没有关注球队，可以在上方选择球队"
      : "目前没有关注球队的比赛。";

  renderMatchCards(matches, elements.followedMatches, emptyText);
  elements.followedMatchCount.textContent = `${matches.length} 场`;
}

function renderNextMatch() {
  const nextMatch = state.matches
    .filter(
      (match) =>
        normalizeStatus(match.status) === "upcoming" &&
        !Number.isNaN(new Date(match.date).getTime())
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  if (!nextMatch) {
    elements.nextMatch.innerHTML =
      '<div class="empty-state">暂无即将开始的比赛</div>';
    return;
  }

  elements.nextMatch.innerHTML = `
    <article class="next-match-card">
      <div>
        <span class="next-match-group">${formatGroupName(nextMatch.group)}</span>
        <p class="next-match-time">${formatBeijingTime(nextMatch.date)}</p>
        <p class="match-location">${nextMatch.city} · ${nextMatch.stadium}</p>
      </div>
      <div class="next-match-teams">
        <div>
          ${teamNameHtml(nextMatch.homeTeam, nextMatch.homeTeamZh)}
        </div>
        <b>VS</b>
        <div>
          ${teamNameHtml(nextMatch.awayTeam, nextMatch.awayTeamZh)}
        </div>
      </div>
    </article>
  `;
}

function renderMatchesByDate(matches) {
  if (matches.length === 0) {
    elements.allMatches.innerHTML =
      '<div class="empty-state">没有找到符合条件的比赛</div>';
    return;
  }

  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const groups = new Map();

  sortedMatches.forEach((match) => {
    const dateLabel = formatBeijingDate(match.date);
    if (!groups.has(dateLabel)) groups.set(dateLabel, []);
    groups.get(dateLabel).push(match);
  });

  elements.allMatches.innerHTML = [...groups.entries()]
    .map(
      ([dateLabel, dateMatches]) => `
        <section class="date-group">
          <h3 class="date-heading">${dateLabel}</h3>
          <div class="match-grid">
            ${matchCardsHtml(dateMatches)}
          </div>
        </section>
      `
    )
    .join("");
}

function renderMatchCards(matches, container, emptyText) {
  if (matches.length === 0) {
    container.innerHTML = `<div class="empty-state">${emptyText}</div>`;
    return;
  }

  container.innerHTML = matchCardsHtml(matches);
}

function matchCardsHtml(matches) {
  return matches
    .map((match) => {
      const matchId = String(match.id);
      const isFavorite = state.favoriteMatches.includes(matchId);
      const hasScore = match.homeScore !== null && match.awayScore !== null;
      const displayStatus = normalizeStatus(match.status);

      return `
        <article class="match-card">
          <div class="match-card-header">
            <span class="group-name">${formatGroupName(match.group)}</span>
            <span class="status status-${displayStatus}">${STATUS_LABELS[displayStatus]}</span>
          </div>

          <div class="teams">
            ${teamRow(match.homeTeamZh, match.homeTeam, hasScore ? match.homeScore : "-")}
            ${teamRow(match.awayTeamZh, match.awayTeam, hasScore ? match.awayScore : "-")}
          </div>

          <p class="match-time">${formatBeijingTime(match.date)}</p>
          <p class="match-location">${match.city} · ${match.stadium}</p>

          <div class="match-card-footer">
            <span class="timezone-label">北京时间</span>
            <button
              class="favorite-button ${isFavorite ? "active" : ""}"
              type="button"
              data-favorite-match="${matchId}"
              aria-pressed="${isFavorite}"
            >
              ${isFavorite ? "已收藏" : "收藏比赛"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function teamRow(nameZh, name, score) {
  return `
    <div class="team-row">
      <div class="team-name">
        ${teamNameHtml(name, nameZh)}
      </div>
      <span class="score">${score}</span>
    </div>
  `;
}

function teamNameHtml(teamName, teamZhName) {
  const chineseName = normalizeChineseName(teamName, teamZhName);
  if (!chineseName) return `<strong>${teamName}</strong>`;
  return `<strong>${chineseName}</strong><span>${teamName}</span>`;
}

function formatBeijingTime(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(dateString));
}

function formatBeijingDate(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(dateString));
}

function formatBeijingDateTime(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(dateString));
}

function formatGroupName(group) {
  return /^[A-Z]$/.test(group) ? `${group} 组` : group;
}

function normalizeStatus(status) {
  return status === "not_started" ? "upcoming" : status;
}

function toggleFavoriteMatch(matchId) {
  matchId = String(matchId);

  if (state.favoriteMatches.includes(matchId)) {
    state.favoriteMatches = state.favoriteMatches.filter((id) => id !== matchId);
  } else {
    state.favoriteMatches.push(matchId);
  }

  saveStoredArray(STORAGE_KEYS.favoriteMatches, state.favoriteMatches);
  renderMatches();
  renderFollowedMatches();
  renderFavoriteMatches();
}

function toggleFollowedTeam(teamName) {
  if (state.followedTeams.includes(teamName)) {
    state.followedTeams = state.followedTeams.filter((name) => name !== teamName);
  } else {
    state.followedTeams.push(teamName);
  }

  saveStoredArray(STORAGE_KEYS.followedTeams, state.followedTeams);
  renderTeamButtons();
  renderFollowedMatches();
  if (state.followedOnly) renderMatches();
}

function renderTeamButtons() {
  elements.teamList.innerHTML = state.teams
    .map((team) => {
      const isFollowed = state.followedTeams.includes(team.name);
      return `
        <button
          class="team-button ${isFollowed ? "active" : ""}"
          type="button"
          data-follow-team="${team.name}"
          aria-pressed="${isFollowed}"
        >
          ${formatTeamDisplayName(team.name, team.nameZh)}
        </button>
      `;
    })
    .join("");
}

function renderFavoriteMatches() {
  const matches = state.matches.filter((match) =>
    state.favoriteMatches.includes(String(match.id))
  );

  if (matches.length === 0) {
    elements.favoriteMatches.innerHTML =
      '<p class="muted">还没有收藏比赛，可以在比赛卡片中点击“收藏比赛”。</p>';
    return;
  }

  elements.favoriteMatches.innerHTML = matches
    .map(
      (match) => `
        <div class="favorite-summary">
          <div>
            <p>${formatTeamDisplayName(match.homeTeam, match.homeTeamZh)} vs ${formatTeamDisplayName(match.awayTeam, match.awayTeamZh)}</p>
            <span>${formatBeijingTime(match.date)} · 北京时间</span>
          </div>
          <button
            class="text-button"
            type="button"
            data-favorite-match="${String(match.id)}"
          >
            取消
          </button>
        </div>
      `
    )
    .join("");
}

function renderStandings() {
  const groups = [
    ...new Set(
      state.matches
        .map((match) => match.group)
        .filter((group) => /^[A-Z]$/.test(group))
    )
  ].sort();

  elements.standings.innerHTML = groups
    .map((group) => {
      const rows = calculateGroupStandings(group);
      return `
        <article class="standings-card">
          <h3>${group} 组积分榜</h3>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>球队</th>
                  <th>场次</th>
                  <th>胜</th>
                  <th>平</th>
                  <th>负</th>
                  <th>进球</th>
                  <th>失球</th>
                  <th>净胜球</th>
                  <th>积分</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(standingsRow).join("")}
              </tbody>
            </table>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFilterSummary() {
  const selectedTeam = state.teams.find(
    (team) => team.name === elements.teamFilter.value
  );
  const teamLabel = selectedTeam ? selectedTeam.nameZh : "全部";
  const groupLabel =
    elements.groupFilter.value === "all"
      ? "全部"
      : formatGroupName(elements.groupFilter.value);
  const statusLabel =
    elements.statusFilter.value === "all"
      ? "全部"
      : STATUS_LABELS[elements.statusFilter.value];

  elements.filterSummary.innerHTML = `
    <span>当前球队：<strong>${teamLabel}</strong></span>
    <span>当前小组：<strong>${groupLabel}</strong></span>
    <span>当前状态：<strong>${statusLabel}</strong></span>
    <span>关注筛选：<strong>${state.followedOnly ? "已开启" : "未开启"}</strong></span>
  `;
}

function calculateGroupStandings(group) {
  const groupTeams = state.teams.filter((team) => team.group === group);
  const table = new Map(
    groupTeams.map((team) => [
      team.name,
      {
        name: team.name,
        nameZh: team.nameZh,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      }
    ])
  );

  state.matches
    .filter(
      (match) =>
        match.group === group &&
        match.status === "finished" &&
        Number.isFinite(match.homeScore) &&
        Number.isFinite(match.awayScore)
    )
    .forEach((match) => updateTableFromMatch(table, match));

  return [...table.values()]
    .map((team) => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name)
    );
}

function updateTableFromMatch(table, match) {
  const home = table.get(match.homeTeam);
  const away = table.get(match.awayTeam);
  if (!home || !away) return;

  home.played += 1;
  away.played += 1;
  home.goalsFor += match.homeScore;
  home.goalsAgainst += match.awayScore;
  away.goalsFor += match.awayScore;
  away.goalsAgainst += match.homeScore;

  if (match.homeScore > match.awayScore) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (match.homeScore < match.awayScore) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
  }
}

function standingsRow(team, index) {
  const goalDifference =
    team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference;

  return `
    <tr>
      <td class="table-rank">${index + 1}</td>
      <td class="table-team">
        <strong>${team.nameZh}</strong>
        <span>${team.name}</span>
      </td>
      <td>${team.played}</td>
      <td>${team.won}</td>
      <td>${team.drawn}</td>
      <td>${team.lost}</td>
      <td>${team.goalsFor}</td>
      <td>${team.goalsAgainst}</td>
      <td>${goalDifference}</td>
      <td><strong>${team.points}</strong></td>
    </tr>
  `;
}

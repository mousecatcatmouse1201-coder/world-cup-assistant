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
  scheduleExpanded: false,
  followedTeams: readStoredArray(STORAGE_KEYS.followedTeams),
  favoriteMatches: readStoredArray(STORAGE_KEYS.favoriteMatches).map(String)
};

const elements = {
  loadingMessage: document.querySelector("#loading-message"),
  statusSource: document.querySelector("#status-source"),
  statusUpdatedAt: document.querySelector("#status-updated-at"),
  statusMatchCount: document.querySelector("#status-match-count"),
  followedMatches: document.querySelector("#followed-matches"),
  followedMatchCount: document.querySelector("#followed-match-count"),
  followedTeamSummary: document.querySelector("#followed-team-summary"),
  recentMatches: document.querySelector("#recent-matches"),
  recentMatchCount: document.querySelector("#recent-match-count"),
  allMatches: document.querySelector("#all-matches"),
  matchCount: document.querySelector("#match-count"),
  toggleAllMatches: document.querySelector("#toggle-all-matches"),
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
  const deploymentMode = document
    .querySelector('meta[name="deployment-mode"]')
    ?.getAttribute("content");
  const isPythonStaticPreview =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "8000";
  const shouldRequestApi =
    deploymentMode !== "static" &&
    window.location.protocol !== "file:" &&
    !isPythonStaticPreview;

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
    : "以数据文件为准";
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
    state.scheduleExpanded = false;
    renderMatches();
  });

  elements.toggleAllMatches.addEventListener("click", () => {
    state.scheduleExpanded = !state.scheduleExpanded;
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
  renderMatches();
  renderFollowedMatches();
  renderRecentMatches();
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

  const sortedMatches = sortMatchesByViewingPriority(filteredMatches);
  const hasActiveFilters = areFiltersActive();
  const visibleMatches =
    hasActiveFilters || state.scheduleExpanded
      ? sortedMatches
      : selectCompactScheduleMatches(sortedMatches);

  renderMatchesByDate(visibleMatches);
  elements.matchCount.textContent = `当前显示：${visibleMatches.length} 场 / 共 ${filteredMatches.length} 场`;
  elements.toggleAllMatches.hidden = hasActiveFilters;
  elements.toggleAllMatches.textContent = state.scheduleExpanded
    ? "收起赛程"
    : "查看全部赛程";
  elements.toggleAllMatches.setAttribute(
    "aria-expanded",
    String(!hasActiveFilters && state.scheduleExpanded)
  );
  renderFilterSummary(visibleMatches.length, filteredMatches.length);
}

function areFiltersActive() {
  return (
    elements.teamFilter.value !== "all" ||
    elements.groupFilter.value !== "all" ||
    elements.statusFilter.value !== "all" ||
    state.followedOnly
  );
}

function selectCompactScheduleMatches(matches) {
  const liveMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "live"
  );
  const upcomingMatches = matches.filter(
    (match) => normalizeStatus(match.status) === "upcoming"
  );

  if (upcomingMatches.length > 0) {
    return [...liveMatches, ...upcomingMatches.slice(0, 8)];
  }

  return matches.slice(0, 8);
}

function renderFollowedMatches() {
  if (state.followedTeams.length === 0) {
    elements.followedTeamSummary.innerHTML = `
      <strong>你还没有关注球队</strong>
      <span>选择你关注的球队后，这里会优先显示相关比赛。</span>
    `;
    elements.followedMatchCount.hidden = true;
    elements.followedMatches.innerHTML = "";
    return;
  }

  const followedTeamLabels = state.followedTeams.map((teamName) => {
    const team = state.teams.find((item) => item.name === teamName);
    return formatTeamDisplayName(teamName, team?.nameZh);
  });
  const allMatches = sortMatchesByViewingPriority(
    state.matches.filter(
      (match) =>
        state.followedTeams.includes(match.homeTeam) ||
        state.followedTeams.includes(match.awayTeam)
    )
  );
  const visibleMatches = allMatches.slice(0, 5);

  elements.followedTeamSummary.innerHTML = `
    <strong>你关注的球队：</strong>
    <span>${followedTeamLabels.join("、")}</span>
  `;
  elements.followedMatchCount.hidden = false;
  elements.followedMatchCount.textContent = `${allMatches.length} 场相关比赛`;
  renderMatchCards(
    visibleMatches,
    elements.followedMatches,
    "目前没有关注球队的比赛。"
  );
}

function renderRecentMatches() {
  const recentMatches = selectRecentMatches(state.matches);
  renderMatchCards(
    sortMatchesByViewingPriority(recentMatches),
    elements.recentMatches,
    "近期暂无比赛"
  );
  elements.recentMatchCount.textContent = `${recentMatches.length} 场`;
}

function renderMatchesByDate(matches) {
  if (matches.length === 0) {
    elements.allMatches.innerHTML =
      '<div class="empty-state">没有找到符合条件的比赛</div>';
    return;
  }

  const groups = new Map();

  matches.forEach((match) => {
    const status = normalizeStatus(match.status);
    const dateLabel = formatBeijingDate(match.date);
    const groupKey = `${status}:${dateLabel}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        title: `${STATUS_LABELS[status]} · ${dateLabel}`,
        matches: []
      });
    }
    groups.get(groupKey).matches.push(match);
  });

  elements.allMatches.innerHTML = [...groups.values()]
    .map(
      ({ title, matches: dateMatches }) => `
        <section class="date-group">
          <h3 class="date-heading">${title}</h3>
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
      const homeName = formatTeamDisplayName(match.homeTeam, match.homeTeamZh);
      const awayName = formatTeamDisplayName(match.awayTeam, match.awayTeamZh);
      const resultLine = matchResultLine(match, displayStatus, hasScore);

      return `
        <article class="match-card match-card-${displayStatus}">
          <div class="match-card-header">
            <span class="status status-${displayStatus}">${STATUS_LABELS[displayStatus]}</span>
            <span class="group-name">${formatGroupName(match.group)}</span>
          </div>

          <h3 class="match-title">${homeName} <span>vs</span> ${awayName}</h3>

          <p class="match-highlight">${resultLine}</p>
          <p class="match-location">
            ${formatGroupName(match.group)} · ${match.city} · ${match.stadium}
          </p>

          <div class="match-card-footer">
            <span class="timezone-label">${formatBeijingDateTime(match.date)}</span>
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

function matchResultLine(match, status, hasScore) {
  if (status === "live") {
    return hasScore
      ? `进行中 · 当前比分 ${match.homeScore} - ${match.awayScore}`
      : "进行中";
  }
  if (status === "finished") {
    return hasScore
      ? `${match.homeScore} - ${match.awayScore} · 已结束`
      : "已结束";
  }
  return `未开始 · 北京时间 ${formatBeijingDateTime(match.date)}`;
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

function sortMatchesByViewingPriority(matches) {
  const statusOrder = { live: 0, upcoming: 1, finished: 2 };
  return [...matches].sort((a, b) => {
    const statusA = normalizeStatus(a.status);
    const statusB = normalizeStatus(b.status);
    const statusDifference =
      (statusOrder[statusA] ?? 3) - (statusOrder[statusB] ?? 3);
    if (statusDifference !== 0) return statusDifference;

    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (statusA === "finished") return timeB - timeA;
    return timeA - timeB;
  });
}

function selectRecentMatches(matches) {
  const now = new Date();
  const todayKey = formatBeijingDateKey(now);
  const todayMatches = matches.filter(
    (match) => formatBeijingDateKey(match.date) === todayKey
  );
  if (todayMatches.length > 0) return todayMatches;

  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const recentWindow = matches.filter((match) => {
    const difference = Math.abs(new Date(match.date).getTime() - now.getTime());
    return difference <= sevenDays;
  });
  if (recentWindow.length > 0) {
    return sortMatchesByViewingPriority(recentWindow).slice(0, 5);
  }

  const upcomingMatches = matches
    .filter(
      (match) =>
        normalizeStatus(match.status) === "upcoming" &&
        new Date(match.date).getTime() >= now.getTime()
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (upcomingMatches.length > 0) return upcomingMatches;

  return matches
    .filter((match) => normalizeStatus(match.status) === "finished")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
}

function formatBeijingDateKey(dateValue) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(dateValue));
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
  renderRecentMatches();
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
  const matches = sortMatchesByViewingPriority(
    state.matches.filter((match) =>
      state.favoriteMatches.includes(String(match.id))
    )
  );

  if (matches.length === 0) {
    elements.favoriteMatches.innerHTML = `
      <div class="watchlist-empty">
        <strong>你还没有收藏比赛</strong>
        <span>点击比赛卡片上的收藏按钮，可以把想看的比赛加入观赛清单。</span>
      </div>
    `;
    return;
  }

  elements.favoriteMatches.innerHTML = matches
    .map((match) => {
      const status = normalizeStatus(match.status);
      const hasScore = match.homeScore !== null && match.awayScore !== null;
      const watchlistHighlight =
        status === "upcoming"
          ? "等待开赛"
          : matchResultLine(match, status, hasScore);

      return `
        <article class="watchlist-item watchlist-item-${status}">
          <div class="watchlist-content">
            <div class="watchlist-meta">
              <span class="status status-${status}">${STATUS_LABELS[status]}</span>
              <span>${formatGroupName(match.group)}</span>
            </div>
            <h3>
              ${formatTeamDisplayName(match.homeTeam, match.homeTeamZh)}
              <span>vs</span>
              ${formatTeamDisplayName(match.awayTeam, match.awayTeamZh)}
            </h3>
            <p>${watchlistHighlight}</p>
            <small>北京时间 ${formatBeijingDateTime(match.date)}</small>
          </div>
          <button
            class="secondary-button watchlist-remove"
            type="button"
            data-favorite-match="${String(match.id)}"
          >
            取消收藏
          </button>
        </article>
      `;
    })
    .join("");
}

function renderStandings() {
  const groups = [
    ...new Set(
      state.matches
        .map((match) => match.group)
        .filter((group) => /^[A-Z]$/.test(group))
    )
  ].sort((a, b) => groupDisplayPriority(a) - groupDisplayPriority(b) || a.localeCompare(b));

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

function groupDisplayPriority(group) {
  const hasFinishedMatch = state.matches.some(
    (match) =>
      match.group === group &&
      normalizeStatus(match.status) === "finished" &&
      Number.isFinite(match.homeScore) &&
      Number.isFinite(match.awayScore)
  );
  const hasFollowedTeam = state.teams.some(
    (team) => team.group === group && state.followedTeams.includes(team.name)
  );

  if (hasFinishedMatch || hasFollowedTeam) return 0;
  return 1;
}

function renderFilterSummary(visibleCount, totalCount) {
  const selectedTeam = state.teams.find(
    (team) => team.name === elements.teamFilter.value
  );
  const teamLabel = selectedTeam
    ? formatTeamDisplayName(selectedTeam.name, selectedTeam.nameZh)
    : "全部球队";
  const groupLabel =
    elements.groupFilter.value === "all"
      ? "全部小组"
      : formatGroupName(elements.groupFilter.value);
  const statusLabel =
    elements.statusFilter.value === "all"
      ? "全部状态"
      : STATUS_LABELS[elements.statusFilter.value];
  const followedLabel = state.followedOnly ? " / 只看关注球队" : "";

  elements.filterSummary.innerHTML = `
    <span>当前筛选：<strong>${teamLabel} / ${groupLabel} / ${statusLabel}${followedLabel}</strong></span>
    <span>当前显示：<strong>${visibleCount} 场比赛</strong>，筛选结果共 ${totalCount} 场</span>
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

export const COMPARISON_MODES = {
  month: { label: "월별", monthCount: 1 },
  quarter: { label: "3개월별", monthCount: 3 },
  half: { label: "6개월별", monthCount: 6 },
  rollingYear: { label: "12개월간", monthCount: 12 },
  year: { label: "연간", monthCount: 12 }
};

function lastDayOfMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function completeMonthKey(key) {
  const value = String(key || "");
  const month = value.match(/^(\d{4})-(\d{2})(?:$|-01_(\d{4}-\d{2}-\d{2})$)/);
  if (!month || Number(month[2]) < 1 || Number(month[2]) > 12) return null;
  const monthKey = `${month[1]}-${month[2]}`;
  return !month[3] || month[3] === lastDayOfMonth(monthKey) ? monthKey : null;
}

export function buildComparisonOptions(reportKeys, mode) {
  if (mode === "month") return reportKeys.map((key) => ({ key, reportKeys: [key] }));
  const count = COMPARISON_MODES[mode]?.monthCount;
  if (!count) return [];
  const byMonth = new Map();
  for (const key of [...reportKeys].sort()) {
    const month = completeMonthKey(key);
    if (month && !byMonth.has(month)) byMonth.set(month, key);
  }
  return [...byMonth.keys()].sort().flatMap((start) => {
    if (mode === "year" && !start.endsWith("-01")) return [];
    const [year, month] = start.split("-").map(Number);
    const monthKeys = Array.from({ length: count }, (_, offset) => new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7));
    if (monthKeys.some((key) => !byMonth.has(key))) return [];
    const end = monthKeys.at(-1);
    return [{ key: `${mode}:${start}`, label: mode === "year" ? `${year}년 (1~12월)` : `${start.replace("-", ".")} ~ ${end.replace("-", ".")} (${count}개월)`,
      monthKeys, reportKeys: monthKeys.map((key) => byMonth.get(key)), startDate: `${start}-01`, endDate: lastDayOfMonth(end) }];
  });
}

export function comparisonMethodText(mode) {
  if (mode === "month") return "월별 저장 자료의 검색 순위를 직접 비교하며 기간별 상대 점수는 사용하지 않습니다.";
  const count = COMPARISON_MODES[mode].monthCount;
  const range = mode === "year" ? "각 연도 1~12월" : `선택한 시작월부터 연속 ${count}개월`;
  return `${range}의 검색 순위를 평균합니다. 해당 월에 없는 키워드는 501위로 반영한 뒤 묶음 기간 안에서 다시 1~500위 순위를 부여하며 상대 점수는 사용하지 않습니다.`;
}

export function buildComparisonPeriods(reports, mode, selectedPeriodKeys = null) {
  const sorted = [...reports].sort((a, b) => String(a.endDate || "").localeCompare(String(b.endDate || "")));
  if (mode === "month") return { periods: sorted, note: "월별 검색 순위 기준 · 상대 점수 미사용" };
  const byMonth = new Map();
  let excluded = 0;
  for (const report of sorted) {
    const key = completeMonthKey(`${report.startDate}_${report.endDate}`);
    if (key) byMonth.set(key, report); else excluded++;
  }
  const definitions = buildComparisonOptions([...byMonth.keys()], mode);
  const selected = selectedPeriodKeys ? new Set(selectedPeriodKeys) : null;
  const periods = definitions.filter((definition) => !selected || selected.has(definition.key))
    .map((definition) => aggregateRankingPeriod(definition, definition.monthKeys.map((key) => byMonth.get(key))));
  const notes = [`완성된 ${COMPARISON_MODES[mode].label} ${periods.length}개`];
  if (selected && selected.size > periods.length) notes.push(`월 자료가 불완전한 기간 ${selected.size - periods.length}개 제외`);
  if (excluded) notes.push(`완전한 달력 월이 아닌 자료 ${excluded}개 제외`);
  notes.push("상대 점수 미사용");
  return { periods, note: notes.join(" · ") };
}

export function buildKeywordRankChanges(points) {
  let rankedBefore = false;
  return points.map((point, index) => {
    const previous = points[index - 1];
    const seen = rankedBefore;
    if (point) rankedBefore = true;
    if (index === 0 || (!previous && !point)) return null;
    if (!point) return { type: "exited", delta: null };
    if (!previous) return { type: seen ? "returning" : "new", delta: null };
    const delta = Number(previous.rank) - Number(point.rank);
    return { type: delta > 0 ? "rising" : delta < 0 ? "falling" : "unchanged", delta };
  });
}

function aggregateRankingPeriod(definition, sourceReports) {
  const rows = aggregateRankingRows(sourceReports);
  return {
    month: definition.key,
    comparisonLabel: definition.label,
    startDate: definition.startDate,
    endDate: definition.endDate,
    count: rows.length,
    rows,
    sourceMonthCount: sourceReports.length,
    categoryPath: sourceReports.at(-1)?.categoryPath || []
  };
}

export function aggregateRankingRows(sourceReports) {
  const reportMaps = sourceReports.map((report) => new Map(
    (report.rows || [])
      .map((row) => [normalizeText(row.keyword), row])
      .filter(([key]) => key)
  ));
  const keys = new Set(reportMaps.flatMap((rows) => [...rows.keys()]));
  return [...keys].map((key) => {
    const points = reportMaps.map((rows) => rows.get(key) || null);
    const ranks = points.map((row) => row ? Number(row.rank) : 501);
    const latest = [...points].reverse().find(Boolean);
    return {
      keyword: latest?.keyword || key,
      categories: latest?.categories || [],
      averageMonthlyRank: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length,
      presentMonthCount: points.filter(Boolean).length,
      latestMonthlyRank: Number(latest?.rank || 501)
    };
  }).sort((a, b) =>
    a.averageMonthlyRank - b.averageMonthlyRank
    || b.presentMonthCount - a.presentMonthCount
    || a.latestMonthlyRank - b.latestMonthlyRank
    || a.keyword.localeCompare(b.keyword, "ko")
  ).slice(0, 500).map((row, index) => ({
    ...row,
    rank: index + 1,
    dailyAverageRatio: 0,
    averageMonthlyRank: Number(row.averageMonthlyRank.toFixed(3))
  }));
}

function normalizeText(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ''); }

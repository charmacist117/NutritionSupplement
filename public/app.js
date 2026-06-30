const statusText = document.querySelector("#status");
const monthList = document.querySelector("#month-list");
const reportTitle = document.querySelector("#report-title");
const reportMeta = document.querySelector("#report-meta");
const reportBody = document.querySelector("#report-body");
const anchorKeyword = document.querySelector("#anchor-keyword");
const collectForm = document.querySelector("#collect-form");
const collectButton = document.querySelector("#collect-button");
const previousMonthButton = document.querySelector("#previous-month-button");
const startDateInput = document.querySelector("#start-date");
const endDateInput = document.querySelector("#end-date");
const downloadButton = document.querySelector("#download-button");
const keywordGroupsInput = document.querySelector("#keyword-groups-input");
const trendRunButton = document.querySelector("#trend-run-button");
const trendHead = document.querySelector("#trend-head");
const trendBody = document.querySelector("#trend-body");
const trendChart = document.querySelector("#trend-chart");
const tabButtons = [...document.querySelectorAll("[data-tab]")];
const tabViews = [...document.querySelectorAll("[data-tab-view]")];
const mappingRefreshButton = document.querySelector("#mapping-refresh-button");
const mappingSaveButton = document.querySelector("#mapping-save-button");
const mappingSearch = document.querySelector("#mapping-search");
const mappingFilter = document.querySelector("#mapping-filter");
const mappingStatus = document.querySelector("#mapping-status");
const mappingBody = document.querySelector("#mapping-body");
const PRODUCT_GROUPS = [
  "총합계",
  "오메가3",
  "마그네슘",
  "유산균",
  "장 건강",
  "비타민c",
  "비타민dk",
  "비타민 류",
  "면역 건강",
  "관절 건강",
  "수면 건강",
  "눈 건강",
  "미백",
  "항노화",
  "항염증",
  "철분제",
  "모발 건강",
  "효소식품",
  "코엔자임Q10",
  "항산화",
  "삼(蔘) 류",
  "혈당",
  "단백질",
  "남성 건강",
  "간 건강",
  "여성 건강",
  "호흡기 건강",
  "콜레스테롤",
  "혈행 건강",
  "갱년기 건강",
  "위 건강",
  "뇌 건강",
  "꿀",
  "수족냉증",
  "다이어트",
  "숙취해소",
  "뼈 건강",
  "피로회복",
  "코 건강",
  "구강 건강",
  "기타"
];
const DEFAULT_KEYWORD_GROUPS = [
  "오메가3=오메가3,오메가",
  "마그네슘=마그네슘,마그네슘추천",
  "BNR17=bnr17,bnr,비에날17,비엔알17,비에날,비엔알",
  "콘드로이친=콘드로이친,콘드로이친1200",
  "루테인=루테인",
  "유산균=유산균,락토핏,프로바이오틱스",
  "뉴케어=뉴케어",
  "비타민C=비타민c,비타민씨",
  "관절=관절,MSM,msm,보스웰리아,호관원"
];

let selectedMonth = null;
let currentReport = null;
let reportKeys = [];
let reportCache = new Map();
let categoryMappings = new Map();
let mappingRows = [];

setPreviousMonthDates();
keywordGroupsInput.value = localStorage.getItem("keywordGroups") || DEFAULT_KEYWORD_GROUPS.join("\n");

for (const button of tabButtons) {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
}

previousMonthButton.addEventListener("click", () => {
  setPreviousMonthDates();
  statusText.textContent = "직전월 기간으로 설정했습니다.";
});

downloadButton.addEventListener("click", async () => {
  if (!currentReport) return;

  downloadButton.disabled = true;
  try {
    await downloadReportCsv(currentReport);
  } finally {
    downloadButton.disabled = false;
  }
});

trendRunButton.addEventListener("click", async () => {
  localStorage.setItem("keywordGroups", keywordGroupsInput.value);
  await renderTrendDashboard();
});

mappingRefreshButton.addEventListener("click", async () => {
  await renderMappingSheet({ refreshReports: true });
});

mappingSaveButton.addEventListener("click", async () => {
  await saveCategoryMappingsFromSheet();
});

mappingSearch.addEventListener("input", () => renderMappingRows());
mappingFilter.addEventListener("change", () => renderMappingRows());

collectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  collectButton.disabled = true;
  statusText.textContent = "선택한 기간의 데이터를 수집하는 중입니다.";

  try {
    const response = await fetch("/api/collect-monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: startDateInput.value,
        endDate: endDateInput.value
      })
    });
    const report = await response.json();

    if (!response.ok) {
      const details = formatErrorDetails(report.details);
      throw new Error(`${report.error || "수집에 실패했습니다."}${details}`);
    }

    statusText.textContent = `${report.startDate} ~ ${report.endDate} 수집이 완료되었습니다.`;
    await loadMonths(report.month);
    renderReport(report);
    if (!monthList.querySelector(".month-button")) {
      statusText.textContent = `${report.startDate} ~ ${report.endDate} 수집이 완료되었습니다. Blob 저장소가 없으면 새로고침 후에는 사라질 수 있습니다.`;
    }
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    collectButton.disabled = false;
  }
});

await loadHealth();
await loadCategoryMappings();
await loadMonths();

async function loadHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) return;

    const health = await response.json();

    if (!health.naverConfigured) {
      statusText.textContent = "NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수가 필요합니다.";
      collectButton.disabled = true;
      return;
    }

    if (!health.blobConfigured) {
      statusText.textContent = "Vercel Blob이 연결되지 않았습니다. 수집 결과는 표시되지만 저장되지 않을 수 있습니다.";
      return;
    }

    statusText.textContent = "수집 준비가 완료되었습니다.";
  } catch {
    statusText.textContent = "설정 상태를 확인하지 못했습니다.";
  }
}

async function loadMonths(preferredMonth = null) {
  const response = await fetch("/api/monthly-reports");
  const { months = [] } = response.ok ? await response.json() : { months: [] };
  reportKeys = months;
  reportCache = new Map();

  monthList.replaceChildren();

  if (!months.length) {
    monthList.innerHTML = `<p class="empty">아직 저장된 자료가 없습니다.</p>`;
    if (!collectButton.disabled) {
      statusText.textContent = "날짜를 선택한 뒤 수집을 실행하면 자료가 생성됩니다.";
    }
    return;
  }

  for (const month of months) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = month;
    button.className = "month-button";
    button.addEventListener("click", () => loadReport(month));
    monthList.append(button);
  }

  await loadReport(preferredMonth || months[0]);
  await renderTrendDashboard();
  if (activeTab() === "mapping") await renderMappingSheet();
}

async function setActiveTab(tab) {
  for (const button of tabButtons) {
    button.classList.toggle("active", button.dataset.tab === tab);
  }

  for (const view of tabViews) {
    view.classList.toggle("active", view.dataset.tabView === tab);
  }

  if (tab === "mapping") await renderMappingSheet();
}

function activeTab() {
  return tabButtons.find((button) => button.classList.contains("active"))?.dataset.tab || "reports";
}

async function loadReport(month) {
  selectedMonth = month;
  statusText.textContent = `${month} 자료를 불러오는 중입니다.`;
  updateMonthSelection();

  const report = await fetchReport(month);

  if (!report) {
    statusText.textContent = "자료를 불러오지 못했습니다.";
    return;
  }

  renderReport(report);
  statusText.textContent = `${month} 자료를 표시 중입니다.`;
}

function renderReport(report) {
  currentReport = report;
  selectedMonth = report.month;
  updateMonthSelection();
  downloadButton.disabled = false;

  reportTitle.textContent = `${report.month} 건강식품 Top ${report.count}`;
  reportMeta.textContent = `${report.startDate} ~ ${report.endDate} / ${categoryPathText(report)}`;
  anchorKeyword.textContent = report.anchor?.keyword || "-";

  reportBody.replaceChildren();

  for (const row of report.rows || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.rank}</td>
      <td>${escapeHtml(row.keyword)}</td>
      <td>${formatScore(row.dailyAverageRatio)}</td>
    `;
    reportBody.append(tr);
  }
}

async function downloadReportCsv(report) {
  const rows = report.rows || [];
  const previousReport = await loadPreviousReport(report);
  const previousRows = previousReport?.rows || [];
  const categoryPath = categoryPathText(report);
  const previousLabel = previousReport?.month || "";
  const csvRows = [
    [
      "순위",
      "검색어",
      "일일 점수 평균",
      "기준 키워드",
      "시작일",
      "종료일",
      "카테고리",
      "제품군 분류",
      "타깃 분류",
      "직전월 순위 변동",
      "",
      "직전월 자료",
      "",
      "직전월 순위",
      "직전월 검색어",
      "직전월 점수",
      "직전월 구분",
      "",
      "구분",
      "당월 총계",
      "직전월 총계",
      "증감"
    ],
    ...rows.map((row, index) => [
      row.rank,
      row.keyword,
      formatScore(row.dailyAverageRatio),
      report.anchor?.keyword || "",
      report.startDate || "",
      report.endDate || "",
      categoryPath,
      manualCategoryFor(row.keyword) || productGroupFormula(index + 2),
      targetGroupFormula(index + 2),
      rankChangeFormula(index + 2),
      "",
      index === 0 ? previousLabel : "",
      "",
      previousRows[index]?.rank || "",
      previousRows[index]?.keyword || "",
      previousRows[index] ? formatScore(previousRows[index].dailyAverageRatio) : "",
      previousRows[index] ? manualCategoryFor(previousRows[index].keyword) || productGroupFormula(index + 2, "O") : "",
      "",
      PRODUCT_GROUPS[index] || "",
      PRODUCT_GROUPS[index] ? categoryTotalFormula(index + 2, "current") : "",
      PRODUCT_GROUPS[index] ? categoryTotalFormula(index + 2, "previous") : "",
      PRODUCT_GROUPS[index] ? `=U${index + 2}-T${index + 2}` : ""
    ])
  ];
  const csv = `\uFEFF${csvRows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(report.month || "naver-shopping-insight")}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function renderTrendDashboard() {
  const groups = parseKeywordGroups(keywordGroupsInput.value);
  const reports = await loadAllReports();

  if (!groups.length || !reports.length) {
    trendChart.replaceChildren();
    trendHead.innerHTML = "";
    trendBody.innerHTML = `<tr><td>그룹 정의와 저장된 월별 자료가 필요합니다.</td></tr>`;
    return;
  }

  const months = reports.map((item) => item.month);
  const matrix = groups.map((group) => {
    const points = reports.map((report) => summarizeGroup(report, group));
    const latest = points[points.length - 1] || { score: 0, rank: null };
    const previous = points[points.length - 2] || { score: 0, rank: null };

    return {
      ...group,
      points,
      latestScore: latest.score,
      previousScore: previous.score,
      scoreDelta: latest.score - previous.score,
      latestRank: latest.rank,
      previousRank: previous.rank,
      rankDelta: previous.rank && latest.rank ? previous.rank - latest.rank : null
    };
  });

  renderTrendTable(months, matrix);
  renderTrendChart(months, matrix);
}

async function loadAllReports() {
  const reports = [];
  const orderedKeys = [...reportKeys].reverse();

  for (const key of orderedKeys) {
    const report = await fetchReport(key);
    if (report) reports.push(report);
  }

  return reports;
}

async function fetchReport(month) {
  if (!month) return null;
  if (reportCache.has(month)) return reportCache.get(month);

  const response = await fetch(`/api/monthly-report?month=${encodeURIComponent(month)}`);
  if (!response.ok) return null;

  const report = await response.json();
  reportCache.set(month, report);
  return report;
}

async function loadCategoryMappings() {
  try {
    const response = await fetch("/api/keyword-category-mappings");
    if (!response.ok) return;

    setCategoryMappings(await response.json());
  } catch {
    categoryMappings = new Map();
  }
}

function setCategoryMappings(data) {
  categoryMappings = new Map();

  for (const item of data?.mappings || []) {
    const keyword = String(item.keyword || "").trim();
    const category = String(item.category || "").trim();
    if (!keyword || !category) continue;
    categoryMappings.set(normalizeText(keyword), { keyword, category });
  }
}

async function renderMappingSheet(options = {}) {
  if (!reportKeys.length) {
    mappingRows = [];
    mappingStatus.textContent = "저장된 리포트가 없어 매칭할 키워드가 없습니다.";
    mappingBody.innerHTML = `<tr><td colspan="5">저장된 리포트가 없습니다.</td></tr>`;
    return;
  }

  mappingRefreshButton.disabled = true;
  try {
    if (options.refreshReports) reportCache = new Map();

    const reports = await loadAllReports();
    mappingRows = buildMappingRows(reports);
    renderMappingRows();
  } finally {
    mappingRefreshButton.disabled = false;
  }
}

function buildMappingRows(reports) {
  const byKeyword = new Map();

  for (const report of reports) {
    for (const row of report.rows || []) {
      const key = normalizeText(row.keyword);
      if (!key) continue;

      const existing = byKeyword.get(key) || {
        key,
        keyword: row.keyword,
        monthCount: 0,
        latestMonth: "",
        latestEndDate: "",
        latestRank: null,
        latestScore: 0
      };
      const endDate = reportEndDate(report);

      existing.monthCount += 1;
      if (!existing.latestEndDate || endDate >= existing.latestEndDate) {
        existing.keyword = row.keyword;
        existing.latestMonth = report.month;
        existing.latestEndDate = endDate;
        existing.latestRank = row.rank;
        existing.latestScore = Number(row.dailyAverageRatio || 0);
      }

      byKeyword.set(key, existing);
    }
  }

  return [...byKeyword.values()].sort((a, b) => {
    const aMapped = manualCategoryFor(a.keyword) ? 1 : 0;
    const bMapped = manualCategoryFor(b.keyword) ? 1 : 0;
    return aMapped - bMapped || Number(a.latestRank || 9999) - Number(b.latestRank || 9999) || a.keyword.localeCompare(b.keyword, "ko");
  });
}

function renderMappingRows() {
  const search = normalizeText(mappingSearch.value);
  const filter = mappingFilter.value;
  const rows = mappingRows.filter((row) => {
    const mapped = Boolean(manualCategoryFor(row.keyword));
    if (filter === "mapped" && !mapped) return false;
    if (filter === "unmapped" && mapped) return false;
    return !search || normalizeText(row.keyword).includes(search);
  });
  const mappedCount = mappingRows.filter((row) => manualCategoryFor(row.keyword)).length;

  mappingStatus.textContent = `총 ${mappingRows.length}개 중 ${rows.length}개 표시 · 매칭 완료 ${mappedCount}개`;
  mappingBody.replaceChildren();

  if (!rows.length) {
    mappingBody.innerHTML = `<tr><td colspan="5">조건에 맞는 키워드가 없습니다.</td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");
    const keywordCell = document.createElement("td");
    const monthCell = document.createElement("td");
    const rankCell = document.createElement("td");
    const scoreCell = document.createElement("td");
    const categoryCell = document.createElement("td");
    const select = createCategorySelect(row.keyword);

    keywordCell.textContent = row.keyword;
    monthCell.textContent = row.latestMonth || "-";
    rankCell.textContent = row.latestRank || "-";
    scoreCell.textContent = formatScore(row.latestScore);
    categoryCell.append(select);

    tr.append(keywordCell, monthCell, rankCell, scoreCell, categoryCell);
    fragment.append(tr);
  }

  mappingBody.append(fragment);
}

function createCategorySelect(keyword) {
  const select = document.createElement("select");
  select.className = "category-select";
  select.dataset.keyword = keyword;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "미지정";
  select.append(emptyOption);

  for (const category of PRODUCT_GROUPS.filter((item) => item !== "총합계")) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  }

  select.value = manualCategoryFor(keyword);
  select.addEventListener("change", () => {
    updateCategoryMapping(keyword, select.value);
    const mappedCount = mappingRows.filter((row) => manualCategoryFor(row.keyword)).length;
    mappingStatus.textContent = `총 ${mappingRows.length}개 · 매칭 완료 ${mappedCount}개 · 저장 필요`;
  });

  return select;
}

function updateCategoryMapping(keyword, category) {
  const key = normalizeText(keyword);
  if (!key) return;

  if (!category) {
    categoryMappings.delete(key);
    return;
  }

  categoryMappings.set(key, {
    keyword,
    category
  });
}

async function saveCategoryMappingsFromSheet() {
  mappingSaveButton.disabled = true;
  mappingStatus.textContent = "카테고리 매칭을 저장하는 중입니다.";

  try {
    const mappings = [...categoryMappings.values()]
      .filter((item) => item.keyword && item.category)
      .sort((a, b) => a.keyword.localeCompare(b.keyword, "ko"));
    const response = await fetch("/api/keyword-category-mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappings })
    });
    const saved = await response.json();

    if (!response.ok) {
      throw new Error(saved.error || "카테고리 매칭 저장에 실패했습니다.");
    }

    setCategoryMappings(saved);
    renderMappingRows();
    mappingStatus.textContent = `${saved.mappings.length}개 키워드 매칭을 저장했습니다.`;
  } catch (error) {
    mappingStatus.textContent = error.message;
  } finally {
    mappingSaveButton.disabled = false;
  }
}

function manualCategoryFor(keyword) {
  return categoryMappings.get(normalizeText(keyword))?.category || "";
}

function parseKeywordGroups(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, termsPart = ""] = line.includes("=") ? line.split(/=(.*)/s) : [line, line];
      const label = labelPart.trim();
      const terms = termsPart.split(",").map((term) => normalizeText(term)).filter(Boolean);
      return { label, terms: terms.length ? terms : [normalizeText(label)] };
    })
    .filter((group) => group.label && group.terms.length);
}

function summarizeGroup(report, group) {
  const matched = (report.rows || []).filter((row) => group.terms.some((term) => normalizeText(row.keyword).includes(term)));
  const score = matched.reduce((sum, row) => sum + Number(row.dailyAverageRatio || 0), 0);
  const rank = matched.length ? Math.min(...matched.map((row) => Number(row.rank) || Infinity)) : null;

  return {
    score,
    rank,
    keywords: matched.map((row) => row.keyword)
  };
}

function renderTrendTable(months, matrix) {
  trendHead.innerHTML = `
    <tr>
      <th>그룹</th>
      <th>최근 점수</th>
      <th>점수 증감</th>
      <th>최근 최고순위</th>
      <th>순위 변동</th>
      ${months.map((month) => `<th>${escapeHtml(month)}</th>`).join("")}
    </tr>
  `;
  trendBody.replaceChildren();

  for (const row of matrix.sort((a, b) => b.latestScore - a.latestScore)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.label)}</td>
      <td>${formatScore(row.latestScore)}</td>
      <td>${formatDelta(row.scoreDelta)}</td>
      <td>${row.latestRank || "-"}</td>
      <td>${row.rankDelta == null ? "-" : formatDelta(row.rankDelta)}</td>
      ${row.points.map((point) => `<td>${formatScore(point.score)} / ${point.rank || "-"}</td>`).join("")}
    `;
    trendBody.append(tr);
  }
}

function renderTrendChart(months, matrix) {
  const width = 920;
  const height = 280;
  const padding = { top: 18, right: 20, bottom: 44, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const topSeries = [...matrix].sort((a, b) => b.latestScore - a.latestScore).slice(0, 6);
  const maxScore = Math.max(1, ...topSeries.flatMap((group) => group.points.map((point) => point.score)));
  const colors = ["#168246", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];
  const x = (index) => padding.left + (months.length <= 1 ? chartWidth / 2 : (chartWidth * index) / (months.length - 1));
  const y = (score) => padding.top + chartHeight - (chartHeight * score) / maxScore;

  trendChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  trendChart.innerHTML = `
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" class="axis"></line>
    <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" class="axis"></line>
    ${months.map((month, index) => `<text x="${x(index)}" y="${height - 18}" text-anchor="middle" class="axis-label">${escapeHtml(shortMonth(month))}</text>`).join("")}
    ${topSeries.map((group, groupIndex) => {
      const path = group.points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.score)}`).join(" ");
      const color = colors[groupIndex % colors.length];
      return `
        <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5"></path>
        ${group.points.map((point, index) => `<circle cx="${x(index)}" cy="${y(point.score)}" r="3.5" fill="${color}"></circle>`).join("")}
        <text x="${padding.left + 8}" y="${padding.top + 16 + groupIndex * 18}" class="legend" fill="${color}">${escapeHtml(group.label)}</text>
      `;
    }).join("")}
  `;
}

async function loadPreviousReport(report) {
  const previousKey = previousReportKey(report);
  if (!previousKey) return null;

  const response = await fetch(`/api/monthly-report?month=${encodeURIComponent(previousKey)}`);
  if (!response.ok) return null;
  return response.json();
}

function previousReportKey(report) {
  const key = report.month || selectedMonth;
  const index = reportKeys.indexOf(key);
  if (index >= 0) return reportKeys[index + 1] || null;

  const currentEnd = reportEndDate(report);
  return reportKeys
    .map((item) => ({ key: item, endDate: reportKeyEndDate(item) }))
    .filter((item) => item.endDate && item.endDate < currentEnd)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0]?.key || null;
}

function setPreviousMonthDates() {
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(firstOfThisMonth.getTime() - 86400000);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);

  startDateInput.value = formatDate(start);
  endDateInput.value = formatDate(end);
}

function formatErrorDetails(details) {
  if (!details) return "";

  if (typeof details === "string") {
    return ` (${details.slice(0, 700)})`;
  }

  try {
    return ` (${JSON.stringify(details).slice(0, 700)})`;
  } catch {
    return ` (${String(details).slice(0, 700)})`;
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateMonthSelection() {
  for (const button of monthList.querySelectorAll(".month-button")) {
    button.classList.toggle("active", button.textContent === selectedMonth);
  }
}

function formatScore(value) {
  return Number(value || 0).toFixed(3);
}

function formatDelta(value) {
  const number = Number(value || 0);
  if (!number) return "0.000";
  return `${number > 0 ? "+" : ""}${number.toFixed(3)}`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function shortMonth(value) {
  const text = String(value || "");
  return text.includes("_") ? text.split("_")[0].slice(2) : text.slice(2);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function categoryPathText(report) {
  return Array.isArray(report.categoryPath) ? report.categoryPath.join(" > ") : "";
}

function safeFileName(value) {
  return String(value).replace(/[^0-9A-Za-z._-]+/g, "_");
}

function rankChangeFormula(rowNumber) {
  return `=IFERROR(XLOOKUP(B${rowNumber},$O:$O,$N:$N)-A${rowNumber},"-")`;
}

function categoryTotalFormula(rowNumber, source) {
  const categoryCell = `S${rowNumber}`;
  if (source === "previous") {
    return `=IF(${categoryCell}="총합계",SUM($P:$P),SUMPRODUCT(--($Q$2:$Q$501=${categoryCell}),$P$2:$P$501))`;
  }

  return `=IF(${categoryCell}="총합계",SUM($C:$C),SUMPRODUCT(--($H$2:$H$501=${categoryCell}),$C$2:$C$501))`;
}

function reportEndDate(report) {
  return report.endDate || reportKeyEndDate(report.month || selectedMonth) || "";
}

function reportKeyEndDate(key) {
  const value = String(key || "");
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  }

  return value.match(/^\d{4}-\d{2}-\d{2}_(\d{4}-\d{2}-\d{2})$/)?.[1] || "";
}

function productGroupFormula(rowNumber, column = "B") {
  const cell = `${column}${rowNumber}`;
  return `=LET(kw,${cell},IFS(` +
    `ISNUMBER(SEARCH("오메가",kw)),"오메가3",` +
    `ISNUMBER(SEARCH("마그네슘",kw)),"마그네슘",` +
    `AND(NOT(OR(ISNUMBER(SEARCH("엘레나",kw)),ISNUMBER(SEARCH("펨",kw)),ISNUMBER(SEARCH("질",kw)),ISNUMBER(SEARCH("구강",kw)))),OR(ISNUMBER(SEARCH("유산균",kw)),ISNUMBER(SEARCH("락토핏",kw)),ISNUMBER(SEARCH("프로바이오틱스",kw)),ISNUMBER(SEARCH("드시모네",kw)),ISNUMBER(SEARCH("자로우",kw)))),"유산균",` +
    `OR(ISNUMBER(SEARCH("프리바이오틱스",kw)),ISNUMBER(SEARCH("푸룬",kw)),ISNUMBER(SEARCH("낙산균",kw))),"장 건강",` +
    `OR(ISNUMBER(SEARCH("비타민c",kw)),ISNUMBER(SEARCH("압타민c",kw))),"비타민c",` +
    `OR(ISNUMBER(SEARCH("비타민d",kw)),ISNUMBER(SEARCH("비타민k",kw))),"비타민dk",` +
    `AND(OR(ISNUMBER(SEARCH("비타민",kw)),ISNUMBER(SEARCH("비타",kw)),ISNUMBER(SEARCH("오쏘몰",kw)),ISNUMBER(SEARCH("센트룸",kw))),NOT(OR(ISNUMBER(SEARCH("비타민c",kw)),ISNUMBER(SEARCH("압타민c",kw)),ISNUMBER(SEARCH("비타민d",kw)),ISNUMBER(SEARCH("비타민k",kw))))),"비타민 류",` +
    `OR(ISNUMBER(SEARCH("이뮨",kw)),ISNUMBER(SEARCH("아연",kw)),ISNUMBER(SEARCH("베타글루칸",kw))),"면역 건강",` +
    `OR(ISNUMBER(SEARCH("콘드로이친",kw)),ISNUMBER(SEARCH("msm",kw)),ISNUMBER(SEARCH("난각막",kw)),ISNUMBER(SEARCH("NEM",kw)),ISNUMBER(SEARCH("관절",kw)),ISNUMBER(SEARCH("보스",kw)),ISNUMBER(SEARCH("호관원",kw)),ISNUMBER(SEARCH("옵티머스트",kw)),ISNUMBER(SEARCH("우슬",kw)),ISNUMBER(SEARCH("무브프리",kw)),ISNUMBER(SEARCH("글루코사민",kw))),"관절 건강",` +
    `OR(ISNUMBER(SEARCH("멜라토닌",kw)),ISNUMBER(SEARCH("수면",kw))),"수면 건강",` +
    `OR(ISNUMBER(SEARCH("루테인",kw)),ISNUMBER(SEARCH("블루베리",kw)),ISNUMBER(SEARCH("빌베리",kw)),ISNUMBER(SEARCH("눈",kw)),ISNUMBER(SEARCH("아스타잔틴",kw))),"눈 건강",` +
    `ISNUMBER(SEARCH("글루타치온",kw)),"미백",` +
    `OR(ISNUMBER(SEARCH("nmn",kw)),ISNUMBER(SEARCH("엔엠엔",kw)),ISNUMBER(SEARCH("mnm",kw))),"항노화",` +
    `OR(ISNUMBER(SEARCH("프로폴리스",kw)),ISNUMBER(SEARCH("커큐민",kw)),ISNUMBER(SEARCH("퀘르세틴",kw)),ISNUMBER(SEARCH("브로멜라인",kw)),ISNUMBER(SEARCH("강황",kw)),ISNUMBER(SEARCH("테라큐민",kw)),ISNUMBER(SEARCH("울금",kw))),"항염증",` +
    `ISNUMBER(SEARCH("철분",kw)),"철분제",` +
    `OR(ISNUMBER(SEARCH("비오틴",kw)),ISNUMBER(SEARCH("케라넷",kw)),ISNUMBER(SEARCH("맥주",kw))),"모발 건강",` +
    `ISNUMBER(SEARCH("효소",kw)),"효소식품",` +
    `OR(ISNUMBER(SEARCH("코엔자임",kw)),ISNUMBER(SEARCH("코큐텐",kw))),"코엔자임Q10",` +
    `OR(ISNUMBER(SEARCH("셀렌",kw)),ISNUMBER(SEARCH("셀레늄",kw))),"항산화",` +
    `OR(ISNUMBER(SEARCH("정관장",kw)),ISNUMBER(SEARCH("홍삼",kw)),ISNUMBER(SEARCH("에브리타임",kw)),ISNUMBER(SEARCH("산삼",kw)),ISNUMBER(SEARCH("장뇌삼",kw)),ISNUMBER(SEARCH("홍이장군",kw)),ISNUMBER(SEARCH("인삼",kw))),"삼(蔘) 류",` +
    `OR(ISNUMBER(SEARCH("바나바",kw)),ISNUMBER(SEARCH("뉴케어",kw)),ISNUMBER(SEARCH("애사비",kw))),"혈당",` +
    `OR(ISNUMBER(SEARCH("알부민",kw)),ISNUMBER(SEARCH("펩티드",kw))),"단백질",` +
    `OR(ISNUMBER(SEARCH("아르기닌",kw)),ISNUMBER(SEARCH("마카",kw)),ISNUMBER(SEARCH("쏘팔",kw)),ISNUMBER(SEARCH("옥타",kw)),ISNUMBER(SEARCH("전립",kw)),ISNUMBER(SEARCH("장어",kw)),ISNUMBER(SEARCH("카리토",kw)),ISNUMBER(SEARCH("야관문",kw))),"남성 건강",` +
    `OR(ISNUMBER(SEARCH("밀크씨슬",kw)),ISNUMBER(SEARCH("밀크시슬",kw)),ISNUMBER(SEARCH("간",kw))),"간 건강",` +
    `OR(ISNUMBER(SEARCH("이노시톨",kw)),ISNUMBER(SEARCH("엽산",kw)),ISNUMBER(SEARCH("엘레나",kw)),ISNUMBER(SEARCH("펨",kw)),ISNUMBER(SEARCH("질",kw))),"여성 건강",` +
    `OR(ISNUMBER(SEARCH("도라지",kw)),ISNUMBER(SEARCH("맥문동",kw))),"호흡기 건강",` +
    `ISNUMBER(SEARCH("홍국",kw)),"콜레스테롤",` +
    `OR(ISNUMBER(SEARCH("폴리코사놀",kw)),ISNUMBER(SEARCH("리놀렌산",kw)),ISNUMBER(SEARCH("대마종자",kw)),ISNUMBER(SEARCH("솔잎증류",kw)),ISNUMBER(SEARCH("송침",kw)),ISNUMBER(SEARCH("보라지",kw)),ISNUMBER(SEARCH("콜레스테롤",kw)),ISNUMBER(SEARCH("순환",kw)),ISNUMBER(SEARCH("은행잎",kw))),"혈행 건강",` +
    `ISNUMBER(SEARCH("갱년기",kw)),"갱년기 건강",` +
    `OR(ISNUMBER(SEARCH("매스틱",kw)),ISNUMBER(SEARCH("감초",kw))),"위 건강",` +
    `OR(ISNUMBER(SEARCH("포스파티딜",kw)),ISNUMBER(SEARCH("테아닌",kw)),ISNUMBER(SEARCH("홍경천",kw)),ISNUMBER(SEARCH("뇌",kw))),"뇌 건강",` +
    `ISNUMBER(SEARCH("꿀",kw)),"꿀",` +
    `ISNUMBER(SEARCH("흑염소",kw)),"수족냉증",` +
    `OR(ISNUMBER(SEARCH("베르베린",kw)),ISNUMBER(SEARCH("bnr",kw)),ISNUMBER(SEARCH("비에날",kw)),ISNUMBER(SEARCH("비엔알",kw)),ISNUMBER(SEARCH("알파 cd",kw)),ISNUMBER(SEARCH("알파cd",kw))),"다이어트",` +
    `OR(ISNUMBER(SEARCH("숙취",kw)),ISNUMBER(SEARCH("벌나무",kw))),"숙취해소",` +
    `OR(ISNUMBER(SEARCH("칼마디",kw)),ISNUMBER(SEARCH("mbp",kw)),ISNUMBER(SEARCH("칼슘",kw))),"뼈 건강",` +
    `OR(ISNUMBER(SEARCH("침향환",kw)),ISNUMBER(SEARCH("경옥고",kw)),ISNUMBER(SEARCH("공진단",kw)),ISNUMBER(SEARCH("공진당",kw))),"피로회복",` +
    `OR(ISNUMBER(SEARCH("삼백초",kw)),ISNUMBER(SEARCH("노즈",kw))),"코 건강",` +
    `OR(ISNUMBER(SEARCH("구강",kw)),ISNUMBER(SEARCH("덴티",kw))),"구강 건강",` +
    `TRUE,"기타"))`;
}

function targetGroupFormula(rowNumber) {
  const cell = `B${rowNumber}`;
  return `=LET(t,${cell},child,OR(ISNUMBER(SEARCH("어린이",t)),ISNUMBER(SEARCH("키즈",t)),ISNUMBER(SEARCH("마이타민",t)),AND(ISNUMBER(SEARCH("키",t)),NOT(ISNUMBER(SEARCH("키나제",t)))),ISNUMBER(SEARCH("아이키",t)),AND(ISNUMBER(SEARCH("아이클",t)),SUM(--ISNUMBER(SEARCH({"아이클리어","아이클린"},t)))=0)),baby,SUM(--ISNUMBER(SEARCH({"유아","신생아","아기"},t)))>0,preg,SUM(--ISNUMBER(SEARCH({"임산부","엽산"},t)))>0,female,ISNUMBER(SEARCH("질",t)),family,ISNUMBER(SEARCH("맘",t)),absorption,SUM(--ISNUMBER(SEARCH({"하이퍼셀","아쿠아셀"},t))),IF(child,"어린이",IF(baby,"아기",IF(preg,"임산부",IF(female,"여성",IF(absorption,"흡수율",IF(family,"가족","")))))))`;
}

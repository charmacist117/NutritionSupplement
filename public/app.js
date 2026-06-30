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
const saveReportButton = document.querySelector("#save-report-button");
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
let healthState = {
  naverConfigured: false,
  blobConfigured: false
};

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
    await downloadReportXlsx(currentReport);
  } finally {
    downloadButton.disabled = false;
  }
});

saveReportButton.addEventListener("click", async () => {
  if (!currentReport) return;
  await saveCurrentReport();
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
      throw new Error(formatCollectionError(report));
    }

    statusText.textContent = report.saved
      ? `${report.startDate} ~ ${report.endDate} 수집 및 저장이 완료되었습니다.`
      : `${report.startDate} ~ ${report.endDate} 수집이 완료되었습니다. 리포트 저장은 별도로 필요합니다.`;
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
    healthState = health;

    if (!health.naverConfigured) {
      statusText.textContent = "네이버 Open API 환경변수가 필요합니다. NAVER_CLIENT_ID_1 / NAVER_CLIENT_SECRET_1부터 설정해주세요.";
      collectButton.disabled = true;
      return;
    }

    if (!health.blobConfigured) {
      statusText.textContent = "현재 배포에서 Blob 인증 정보를 찾지 못했습니다. Vercel Blob 연결 후 다시 배포해야 저장됩니다.";
      return;
    }

    statusText.textContent = `수집 준비가 완료되었습니다. 네이버 API 키 ${health.naverCredentialCount || 1}개를 사용할 수 있습니다.`;
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
    if (!collectButton.disabled && healthState.blobConfigured) {
      statusText.textContent = "날짜를 선택한 뒤 수집을 실행하면 자료가 생성됩니다.";
    }
    return;
  }

  for (const month of months) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = periodLabel(month);
    button.dataset.reportKey = month;
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
  saveReportButton.disabled = false;
  downloadButton.disabled = false;

  reportTitle.textContent = `${periodLabel(report)} 건강식품 Top ${report.count}`;
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

async function saveCurrentReport() {
  saveReportButton.disabled = true;
  statusText.textContent = `${periodLabel(currentReport)} 리포트를 저장하는 중입니다.`;

  try {
    const response = await fetch("/api/monthly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentReport)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || storageErrorMessage(result.storage) || "리포트 저장에 실패했습니다.");
    }

    currentReport.saved = true;
    currentReport.storage = result.storage;
    reportCache.set(currentReport.month, currentReport);
    await loadMonths(currentReport.month);
    renderReport(currentReport);
    statusText.textContent = `${periodLabel(currentReport)} 리포트를 저장했습니다.`;
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    saveReportButton.disabled = false;
  }
}

function storageErrorMessage(storage) {
  if (storage?.reason === "Blob credentials are not configured.") {
    return "현재 배포에서 Blob 인증 정보를 찾지 못했습니다. Blob Store 연결 후 Vercel에서 다시 배포해주세요.";
  }

  return "";
}

async function downloadReportXlsx(report) {
  const rows = report.rows || [];
  const currentScoreByGroup = scoreByProductGroup(rows);
  const xlsxRows = [
    [
      "순위",
      "검색어",
      "일일 점수 평균",
      "제품군 분류",
      "타깃 분류",
      "",
      "구분",
      "선택 기간 총계"
    ],
    ...rows.map((row, index) => [
      row.rank,
      row.keyword,
      roundScore(row.dailyAverageRatio),
      productCategoryFor(row.keyword),
      targetCategoryFor(row.keyword),
      "",
      PRODUCT_GROUPS[index] || "",
      PRODUCT_GROUPS[index] ? roundScore(currentScoreByGroup.get(PRODUCT_GROUPS[index]) || 0) : ""
    ])
  ];
  const blob = createXlsxBlob("기간별 리포트", xlsxRows);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(report.month || "naver-shopping-insight")}.xlsx`;
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
    trendBody.innerHTML = `<tr><td>그룹 정의와 저장된 기간별 자료가 필요합니다.</td></tr>`;
    return;
  }

  const months = reports.map((item) => periodLabel(item));
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

function productCategoryFor(keyword) {
  return manualCategoryFor(keyword) || autoProductCategoryFor(keyword);
}

function autoProductCategoryFor(keyword) {
  const kw = normalizeText(keyword);
  const has = (term) => kw.includes(normalizeText(term));
  const any = (terms) => terms.some(has);

  if (has("오메가")) return "오메가3";
  if (has("마그네슘")) return "마그네슘";
  if (!any(["엘레나", "펨", "질", "구강"]) && any(["유산균", "락토핏", "프로바이오틱스", "드시모네", "자로우"])) return "유산균";
  if (any(["프리바이오틱스", "푸룬", "낙산균"])) return "장 건강";
  if (any(["비타민c", "압타민c"])) return "비타민c";
  if (any(["비타민d", "비타민k"])) return "비타민dk";
  if (any(["비타민", "비타", "오쏘몰", "센트룸"]) && !any(["비타민c", "압타민c", "비타민d", "비타민k"])) return "비타민 류";
  if (any(["이뮨", "아연", "베타글루칸"])) return "면역 건강";
  if (any(["콘드로이친", "msm", "난각막", "nem", "관절", "보스", "호관원", "옵티머스트", "우슬", "무브프리", "글루코사민"])) return "관절 건강";
  if (any(["멜라토닌", "수면"])) return "수면 건강";
  if (any(["루테인", "블루베리", "빌베리", "눈", "아스타잔틴"])) return "눈 건강";
  if (has("글루타치온")) return "미백";
  if (any(["nmn", "엔엠엔", "mnm"])) return "항노화";
  if (any(["프로폴리스", "커큐민", "퀘르세틴", "브로멜라인", "강황", "테라큐민", "울금"])) return "항염증";
  if (has("철분")) return "철분제";
  if (any(["비오틴", "케라넷", "맥주"])) return "모발 건강";
  if (has("효소")) return "효소식품";
  if (any(["코엔자임", "코큐텐"])) return "코엔자임Q10";
  if (any(["셀렌", "셀레늄"])) return "항산화";
  if (any(["정관장", "홍삼", "에브리타임", "산삼", "장뇌삼", "홍이장군", "인삼"])) return "삼(蔘) 류";
  if (any(["바나바", "뉴케어", "애사비"])) return "혈당";
  if (any(["알부민", "펩티드"])) return "단백질";
  if (any(["아르기닌", "마카", "쏘팔", "옥타", "전립", "장어", "카리토", "야관문"])) return "남성 건강";
  if (any(["밀크씨슬", "밀크시슬", "간"])) return "간 건강";
  if (any(["이노시톨", "엽산", "엘레나", "펨", "질"])) return "여성 건강";
  if (any(["도라지", "맥문동"])) return "호흡기 건강";
  if (has("홍국")) return "콜레스테롤";
  if (any(["폴리코사놀", "리놀렌산", "대마종자", "솔잎증류", "송침", "보라지", "콜레스테롤", "순환", "은행잎"])) return "혈행 건강";
  if (has("갱년기")) return "갱년기 건강";
  if (any(["매스틱", "감초"])) return "위 건강";
  if (any(["포스파티딜", "테아닌", "홍경천", "뇌"])) return "뇌 건강";
  if (has("꿀")) return "꿀";
  if (has("흑염소")) return "수족냉증";
  if (any(["베르베린", "bnr", "비에날", "비엔알", "알파cd"])) return "다이어트";
  if (any(["숙취", "벌나무"])) return "숙취해소";
  if (any(["칼마디", "mbp", "칼슘"])) return "뼈 건강";
  if (any(["침향환", "경옥고", "공진단", "공진당"])) return "피로회복";
  if (any(["삼백초", "노즈"])) return "코 건강";
  if (any(["구강", "덴티"])) return "구강 건강";
  return "기타";
}

function targetCategoryFor(keyword) {
  const kw = normalizeText(keyword);
  const has = (term) => kw.includes(normalizeText(term));
  const any = (terms) => terms.some(has);

  const child = any(["어린이", "키즈", "마이타민", "아이키"])
    || (has("키") && !has("키나제"))
    || (has("아이클") && !any(["아이클리어", "아이클린"]));
  if (child) return "어린이";
  if (any(["유아", "신생아", "아기"])) return "아기";
  if (any(["임산부", "엽산"])) return "임산부";
  if (has("질")) return "여성";
  if (any(["하이퍼셀", "아쿠아셀"])) return "흡수율";
  if (has("맘")) return "가족";
  return "";
}

function scoreByProductGroup(rows) {
  const scores = new Map(PRODUCT_GROUPS.map((group) => [group, 0]));

  for (const row of rows || []) {
    const score = Number(row.dailyAverageRatio || 0);
    const group = productCategoryFor(row.keyword);
    scores.set("총합계", (scores.get("총합계") || 0) + score);
    scores.set(group, (scores.get(group) || 0) + score);
  }

  return scores;
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

function formatCollectionError(report) {
  const quota = quotaExceededSummary(report.details);
  if (quota) {
    return `${report.error || "네이버 Open API 일일 호출 한도를 모두 사용했습니다."} (${quota})`;
  }

  const details = formatErrorDetails(report.details);
  return `${report.error || "수집에 실패했습니다."}${details}`;
}

function quotaExceededSummary(details) {
  const response = details?.response;
  if (response?.errorCode !== "010" || !String(response.errorMessage || "").includes("Query limit exceeded")) {
    return "";
  }

  const quota = String(response.errorMessage || "").match(/count\/quota=([^}]+)/)?.[1];
  const credentials = details?.credentials;
  const keyText = credentials?.total ? `API 키 ${credentials.exhausted || credentials.current || 1}/${credentials.total}개, ` : "";
  return quota ? `${keyText}사용량 ${quota}` : `${keyText}일일 한도 초과`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateMonthSelection() {
  for (const button of monthList.querySelectorAll(".month-button")) {
    button.classList.toggle("active", button.dataset.reportKey === selectedMonth);
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

function periodLabel(reportOrKey) {
  if (typeof reportOrKey === "object" && reportOrKey) {
    return `${reportOrKey.startDate || ""} ~ ${reportOrKey.endDate || ""}`.trim();
  }

  const key = String(reportOrKey || "");
  const range = key.match(/^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/);
  if (range) return `${range[1]} ~ ${range[2]}`;
  return key;
}

function roundScore(value) {
  return Number(Number(value || 0).toFixed(3));
}

function createXlsxBlob(sheetName, rows) {
  const safeSheetName = sanitizeSheetName(sheetName);
  const createdAt = new Date().toISOString();
  const files = [
    ["[Content_Types].xml", contentTypesXml()],
    ["_rels/.rels", rootRelsXml()],
    ["docProps/core.xml", coreXml(createdAt)],
    ["docProps/app.xml", appXml()],
    ["xl/workbook.xml", workbookXml(safeSheetName)],
    ["xl/_rels/workbook.xml.rels", workbookRelsXml()],
    ["xl/styles.xml", stylesXml()],
    ["xl/worksheets/sheet1.xml", worksheetXml(rows)]
  ];

  return new Blob([zipFiles(files)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

function sanitizeSheetName(value) {
  return String(value || "Sheet1").replace(/[\\/?*:[\]]/g, " ").slice(0, 31) || "Sheet1";
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function coreXml(createdAt) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>NutritionSupplement</dc:creator>
  <cp:lastModifiedBy>NutritionSupplement</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${createdAt}</dcterms:modified>
</cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>NutritionSupplement</Application>
</Properties>`;
}

function workbookXml(sheetName) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function worksheetXml(rows) {
  const sheetData = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.map((value, columnIndex) => cellXml(value, rowNumber, columnIndex + 1)).join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="6" width="18" customWidth="1"/>
    <col min="7" max="8" width="16" customWidth="1"/>
  </cols>
  <sheetData>${sheetData}</sheetData>
</worksheet>`;
}

function cellXml(value, rowNumber, columnNumber) {
  if (value === "" || value == null) return "";

  const ref = `${columnName(columnNumber)}${rowNumber}`;
  const style = rowNumber === 1 ? ` s="1"` : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${style}><v>${value}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr"${style}><is><t>${xmlEscape(value)}</t></is></c>`;
}

function columnName(columnNumber) {
  let name = "";
  let cursor = columnNumber;
  while (cursor > 0) {
    const remainder = (cursor - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    cursor = Math.floor((cursor - 1) / 26);
  }
  return name;
}

function xmlEscape(value) {
  return String(value).replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[char]));
}

function zipFiles(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const dataBytes = typeof content === "string" ? encoder.encode(content) : content;
    const crc = crc32(dataBytes);
    const localHeader = zipLocalHeader(nameBytes, dataBytes, crc);
    const centralHeader = zipCentralHeader(nameBytes, dataBytes, crc, offset);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = zipEndRecord(files.length, centralSize, offset);
  return concatBytes([...localParts, ...centralParts, end]);
}

function zipLocalHeader(nameBytes, dataBytes, crc) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0x5c21, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, dataBytes.length, true);
  view.setUint32(22, dataBytes.length, true);
  view.setUint16(26, nameBytes.length, true);
  header.set(nameBytes, 30);
  return header;
}

function zipCentralHeader(nameBytes, dataBytes, crc, offset) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0x5c21, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, dataBytes.length, true);
  view.setUint32(24, dataBytes.length, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function zipEndRecord(fileCount, centralSize, centralOffset) {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  return header;
}

function concatBytes(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
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

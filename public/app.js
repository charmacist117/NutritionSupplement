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
const tabButtons = [...document.querySelectorAll("[data-tab]")];
const tabViews = [...document.querySelectorAll("[data-tab-view]")];
const mappingRefreshButton = document.querySelector("#mapping-refresh-button");
const mappingApplySuggestionsButton = document.querySelector("#mapping-apply-suggestions");
const mappingSaveButton = document.querySelector("#mapping-save-button");
const mappingSummary = document.querySelector("#mapping-summary");
const mappingSearch = document.querySelector("#mapping-search");
const mappingFilter = document.querySelector("#mapping-filter");
const mappingStatus = document.querySelector("#mapping-status");
const mappingBody = document.querySelector("#mapping-body");
const mappingCategoryOptions = document.querySelector("#mapping-category-options");
const categoryAddInput = document.querySelector("#category-add-input");
const categoryAddButton = document.querySelector("#category-add-button");
const categoryManageSelect = document.querySelector("#category-manage-select");
const categoryRenameInput = document.querySelector("#category-rename-input");
const categoryRenameButton = document.querySelector("#category-rename-button");
const categoryDeleteButton = document.querySelector("#category-delete-button");
const categoryStatusRefreshButton = document.querySelector("#category-status-refresh");
const categoryStatusSummary = document.querySelector("#category-status-summary");
const statusSeriesType = document.querySelector("#status-series-type");
const statusSeriesSearch = document.querySelector("#status-series-search");
const statusSeriesOptions = document.querySelector("#status-series-options");
const statusSeriesAddButton = document.querySelector("#status-series-add");
const statusSeriesList = document.querySelector("#status-series-list");
const categoryRankChart = document.querySelector("#category-rank-chart");
const categoryRankLegend = document.querySelector("#category-rank-legend");
const categoryListCount = document.querySelector("#category-list-count");
const categoryStatusList = document.querySelector("#category-status-list");
const categoryDetailTitle = document.querySelector("#category-detail-title");
const categoryDetailMeta = document.querySelector("#category-detail-meta");
const categoryPeriodBody = document.querySelector("#category-period-body");
const categoryKeywordSearch = document.querySelector("#category-keyword-search");
const categoryKeywordBody = document.querySelector("#category-keyword-body");
const comparisonSelectAllButton = document.querySelector("#comparison-select-all");
const comparisonClearButton = document.querySelector("#comparison-clear");
const comparisonEmailCopyButton = document.querySelector("#comparison-email-copy");
const comparisonDownloadButton = document.querySelector("#comparison-download");
const executivePdfDownloadButton = document.querySelector("#executive-pdf-download");
const executiveBaselinePeriods = document.querySelector("#executive-baseline-periods");
const executiveCurrentPeriods = document.querySelector("#executive-current-periods");
const executiveReportStatus = document.querySelector("#executive-report-status");
const comparisonModeButtons = [...document.querySelectorAll("[data-comparison-mode]")];
const comparisonPeriodList = document.querySelector("#comparison-period-list");
const comparisonStatus = document.querySelector("#comparison-status");
const comparisonSummary = document.querySelector("#comparison-summary");
const comparisonRangeLabel = document.querySelector("#comparison-range-label");
const comparisonInsights = document.querySelector("#comparison-insights");
const comparisonLatestStatus = document.querySelector("#comparison-latest-status");
const comparisonLatestSummary = document.querySelector("#comparison-latest-summary");
const comparisonLatestBody = document.querySelector("#comparison-latest-body");
const comparisonCategoryHead = document.querySelector("#comparison-category-head");
const comparisonCategoryBody = document.querySelector("#comparison-category-body");
const comparisonKeywordSearch = document.querySelector("#comparison-keyword-search");
const comparisonKeywordFilter = document.querySelector("#comparison-keyword-filter");
const comparisonKeywordStatus = document.querySelector("#comparison-keyword-status");
const comparisonKeywordHead = document.querySelector("#comparison-keyword-head");
const comparisonKeywordBody = document.querySelector("#comparison-keyword-body");
const DEFAULT_PRODUCT_CATEGORIES = [
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
  "노인 건강",
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
const REPORT_ORDER_STORAGE_KEY = "reportOrder";
const COMPARISON_SELECTION_STORAGE_KEY = "comparisonReportSelection";
const COMPARISON_MODE_STORAGE_KEY = "comparisonMode";
const CATEGORY_TREND_SELECTION_STORAGE_KEY = "categoryTrendSelection";
const LATEST_RANK_CHANGE_THRESHOLD = 50;
const MISSING_MONTH_RANK = 501;
const COMPARISON_MODES = {
  month: { label: "월별", monthCount: 1 },
  quarter: { label: "분기별", monthCount: 3 },
  half: { label: "반기별", monthCount: 6 },
  year: { label: "연간", monthCount: 12 }
};

let selectedMonth = null;
let currentReport = null;
let reportKeys = [];
let reportCache = new Map();
let categoryMappings = new Map();
let productCategories = [...DEFAULT_PRODUCT_CATEGORIES];
let categoryAliases = new Map();
let mappingRows = [];
let newKeywordRows = [];
let categoryStatusReports = [];
let categoryStatusRows = [];
let selectedStatusCategory = "";
let selectedTrendSeries = readTrendSeriesSelection();
let draggedReportKey = null;
let comparisonSelectionLoaded = false;
let comparisonSelectedKeys = new Set();
let comparisonReports = [];
let comparisonCategoryRows = [];
let comparisonKeywordRows = [];
let comparisonLatestChanges = [];
let comparisonMode = readComparisonMode();
let executivePeriodSelectionLoaded = false;
let executiveBaselineKeys = new Set();
let executiveCurrentKeys = new Set();
let healthState = {
  naverConfigured: false,
  blobConfigured: false
};

setPreviousMonthDates();
updateComparisonModeButtons();

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

mappingRefreshButton.addEventListener("click", async () => {
  await renderMappingSheet({ refreshReports: true });
});

mappingApplySuggestionsButton.addEventListener("click", () => applyNewKeywordSuggestions());

mappingSaveButton.addEventListener("click", async () => {
  await saveCategoryMappingsFromSheet();
});

mappingSearch.addEventListener("input", () => renderMappingRows());
mappingFilter.addEventListener("change", () => renderMappingRows());

categoryAddButton.addEventListener("click", () => addProductCategory());
categoryAddInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addProductCategory();
  }
});
categoryManageSelect.addEventListener("change", () => {
  categoryRenameInput.value = categoryManageSelect.value;
});
categoryRenameButton.addEventListener("click", () => renameProductCategory());
categoryDeleteButton.addEventListener("click", () => deleteProductCategory());

categoryStatusRefreshButton.addEventListener("click", async () => {
  await renderCategoryStatusSheet({ refreshReports: true });
});
statusSeriesType.addEventListener("change", () => updateStatusSeriesOptions());
statusSeriesSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addTrendSeries();
  }
});
statusSeriesAddButton.addEventListener("click", () => addTrendSeries());
categoryKeywordSearch.addEventListener("input", () => renderCategoryKeywordRows());

comparisonSelectAllButton.addEventListener("click", async () => {
  comparisonSelectedKeys = new Set(reportKeys);
  saveComparisonSelection();
  await renderComparisonSheet();
});

comparisonClearButton.addEventListener("click", async () => {
  comparisonSelectedKeys = new Set();
  saveComparisonSelection();
  await renderComparisonSheet();
});

comparisonPeriodList.addEventListener("change", async (event) => {
  const input = event.target.closest("input[data-report-key]");
  if (!input) return;

  if (input.checked) comparisonSelectedKeys.add(input.dataset.reportKey);
  else comparisonSelectedKeys.delete(input.dataset.reportKey);
  saveComparisonSelection();
  await renderComparisonSheet({ keepPeriodList: true });
});

executiveBaselinePeriods.addEventListener("change", (event) => updateExecutivePeriodSelection(event, executiveBaselineKeys));
executiveCurrentPeriods.addEventListener("change", (event) => updateExecutivePeriodSelection(event, executiveCurrentKeys));

comparisonKeywordSearch.addEventListener("input", () => renderComparisonKeywordRows());
comparisonKeywordFilter.addEventListener("change", () => renderComparisonKeywordRows());

comparisonDownloadButton.addEventListener("click", () => downloadComparisonXlsx());
executivePdfDownloadButton.addEventListener("click", () => downloadExecutivePdf());
comparisonEmailCopyButton.addEventListener("click", () => copyComparisonEmail());

for (const button of comparisonModeButtons) {
  button.addEventListener("click", async () => {
    const nextMode = button.dataset.comparisonMode;
    if (!COMPARISON_MODES[nextMode] || nextMode === comparisonMode) return;

    comparisonMode = nextMode;
    localStorage.setItem(COMPARISON_MODE_STORAGE_KEY, comparisonMode);
    updateComparisonModeButtons();
    await renderComparisonSheet();
  });
}

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
  reportKeys = applySavedReportOrder(months);
  reportCache = new Map();
  refreshExecutivePeriodLists();

  monthList.replaceChildren();

  if (!months.length) {
    monthList.innerHTML = `<p class="empty">아직 저장된 자료가 없습니다.</p>`;
    clearReportView();
    if (activeTab() === "mapping") await renderMappingSheet();
    if (activeTab() === "category-status") await renderCategoryStatusSheet();
    if (activeTab() === "comparison") await renderComparisonSheet();
    if (!collectButton.disabled && healthState.blobConfigured) {
      statusText.textContent = "날짜를 선택한 뒤 수집을 실행하면 자료가 생성됩니다.";
    }
    return;
  }

  renderMonthList();

  const nextMonth = preferredMonth && reportKeys.includes(preferredMonth) ? preferredMonth : reportKeys[0];
  await loadReport(nextMonth);
  if (activeTab() === "mapping") await renderMappingSheet();
  if (activeTab() === "category-status") await renderCategoryStatusSheet();
  if (activeTab() === "comparison") await renderComparisonSheet();
}

function renderMonthList() {
  monthList.replaceChildren();

  for (const month of reportKeys) {
    const item = document.createElement("div");
    item.className = "month-item";
    item.dataset.reportKey = month;
    item.addEventListener("dragover", handleReportDragOver);
    item.addEventListener("dragleave", handleReportDragLeave);
    item.addEventListener("drop", handleReportDrop);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = periodLabel(month);
    button.dataset.reportKey = month;
    button.className = "month-button";
    button.draggable = true;
    button.title = "드래그해서 저장 자료 순서 변경";
    button.addEventListener("click", () => loadReport(month));
    button.addEventListener("dragstart", (event) => handleReportDragStart(event, month, item));
    button.addEventListener("dragend", handleReportDragEnd);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.className = "month-delete-button";
    deleteButton.title = `${periodLabel(month)} 리포트 삭제`;
    deleteButton.setAttribute("aria-label", `${periodLabel(month)} 리포트 삭제`);
    deleteButton.addEventListener("click", () => deleteReport(month));

    item.append(button, deleteButton);
    monthList.append(item);
  }

  updateMonthSelection();
}

async function setActiveTab(tab) {
  for (const button of tabButtons) {
    button.classList.toggle("active", button.dataset.tab === tab);
  }

  for (const view of tabViews) {
    view.classList.toggle("active", view.dataset.tabView === tab);
  }

  if (tab === "mapping") await renderMappingSheet();
  if (tab === "category-status") await renderCategoryStatusSheet();
  if (tab === "comparison") await renderComparisonSheet();
}

function activeTab() {
  return tabButtons.find((button) => button.classList.contains("active"))?.dataset.tab || "reports";
}

async function loadReport(month) {
  selectedMonth = month;
  statusText.textContent = `${periodLabel(month)} 자료를 불러오는 중입니다.`;
  updateMonthSelection();

  const report = await fetchReport(month);

  if (!report) {
    statusText.textContent = "자료를 불러오지 못했습니다.";
    return;
  }

  renderReport(report);
  statusText.textContent = `${periodLabel(report)} 자료를 표시 중입니다.`;
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

function clearReportView() {
  currentReport = null;
  selectedMonth = null;
  updateMonthSelection();
  saveReportButton.disabled = true;
  downloadButton.disabled = true;
  reportTitle.textContent = "리포트 선택";
  reportMeta.textContent = "저장 자료를 선택하거나 기간을 수집하면 Top 500 검색어와 평균 클릭 점수가 표시됩니다.";
  anchorKeyword.textContent = "-";
  reportBody.innerHTML = `<tr><td colspan="3">선택된 리포트가 없습니다.</td></tr>`;
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

async function deleteReport(month) {
  const label = periodLabel(month);
  const confirmed = window.confirm(`${label} 리포트를 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`);
  if (!confirmed) return;

  setMonthListDisabled(true);
  statusText.textContent = `${label} 리포트를 삭제하는 중입니다.`;

  try {
    const response = await fetch(`/api/monthly-report?month=${encodeURIComponent(month)}`, {
      method: "DELETE"
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.error || storageErrorMessage(result.storage) || "리포트 삭제에 실패했습니다.");
    }

    reportCache.delete(month);
    const remainingMonths = reportKeys.filter((key) => key !== month);
    saveReportOrder(remainingMonths);
    const nextMonth = selectedMonth === month ? remainingMonths[0] || null : selectedMonth;

    if (currentReport?.month === month) clearReportView();

    await loadMonths(nextMonth);
    if (activeTab() === "mapping") await renderMappingSheet({ refreshReports: true });
    if (activeTab() === "category-status") await renderCategoryStatusSheet({ refreshReports: true });
    if (activeTab() === "comparison") await renderComparisonSheet({ refreshReports: true });
    statusText.textContent = `${label} 리포트를 삭제했습니다.`;
  } catch (error) {
    statusText.textContent = error.message;
    setMonthListDisabled(false);
  }
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function setMonthListDisabled(disabled) {
  for (const button of monthList.querySelectorAll("button")) {
    button.disabled = disabled;
  }
}

function handleReportDragStart(event, month, item) {
  draggedReportKey = month;
  item.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", month);
}

function handleReportDragOver(event) {
  if (!draggedReportKey) return;

  event.preventDefault();
  const item = event.currentTarget;
  const targetKey = item.dataset.reportKey;
  if (!targetKey || targetKey === draggedReportKey) return;

  clearDropMarkers(item);
  item.classList.add(dropPosition(event, item) === "before" ? "drop-before" : "drop-after");
  event.dataTransfer.dropEffect = "move";
}

function handleReportDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    clearDropMarkers(event.currentTarget);
  }
}

async function handleReportDrop(event) {
  event.preventDefault();
  const item = event.currentTarget;
  const sourceKey = event.dataTransfer.getData("text/plain") || draggedReportKey;
  const targetKey = item.dataset.reportKey;
  const position = dropPosition(event, item);

  clearDropMarkers(item);
  if (!moveReportKey(sourceKey, targetKey, position)) return;

  statusText.textContent = "저장 자료 순서를 변경했습니다.";
  if (activeTab() === "mapping") await renderMappingSheet();
  if (activeTab() === "category-status") await renderCategoryStatusSheet();
}

function handleReportDragEnd() {
  draggedReportKey = null;
  for (const item of monthList.querySelectorAll(".month-item")) {
    item.classList.remove("dragging", "drop-before", "drop-after");
  }
}

function moveReportKey(sourceKey, targetKey, position) {
  if (!sourceKey || !targetKey || sourceKey === targetKey) return false;
  if (!reportKeys.includes(sourceKey) || !reportKeys.includes(targetKey)) return false;

  const nextKeys = reportKeys.filter((key) => key !== sourceKey);
  const targetIndex = nextKeys.indexOf(targetKey);
  if (targetIndex === -1) return false;

  nextKeys.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, sourceKey);
  reportKeys = nextKeys;
  saveReportOrder(reportKeys);
  renderMonthList();
  refreshExecutivePeriodLists();
  return true;
}

function dropPosition(event, item) {
  const rect = item.getBoundingClientRect();
  return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
}

function clearDropMarkers(item) {
  item.classList.remove("drop-before", "drop-after");
}

function applySavedReportOrder(keys) {
  const savedOrder = readReportOrder();
  const keySet = new Set(keys);
  const ordered = savedOrder.filter((key) => keySet.has(key));
  const newKeys = keys.filter((key) => !ordered.includes(key));
  const result = [...newKeys, ...ordered];

  if (savedOrder.length) saveReportOrder(result);
  return result;
}

function readReportOrder() {
  try {
    const value = JSON.parse(localStorage.getItem(REPORT_ORDER_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveReportOrder(keys) {
  localStorage.setItem(REPORT_ORDER_STORAGE_KEY, JSON.stringify(keys));
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
  const aggregateCategories = productGroupsWithTotal();
  const xlsxRows = [
    [
      "순위",
      "검색어",
      "일일 점수 평균",
      "제품군 분류 1",
      "제품군 분류 2",
      "타깃 분류",
      "",
      "구분",
      "선택 기간 총계"
    ],
    ...rows.map((row, index) => {
      const categories = productCategoriesFor(row.keyword);
      return [
        row.rank,
        row.keyword,
        roundScore(row.dailyAverageRatio),
        categories[0] || "",
        categories[1] || "",
        targetCategoryFor(row.keyword),
        "",
        aggregateCategories[index] || "",
        aggregateCategories[index] ? roundScore(currentScoreByGroup.get(aggregateCategories[index]) || 0) : ""
      ];
    })
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

async function loadAllReports() {
  const reports = [];
  const orderedKeys = chronologicalReportKeys(reportKeys);

  for (const key of orderedKeys) {
    const report = await fetchReport(key);
    if (report) reports.push(report);
  }

  return reports;
}

function chronologicalReportKeys(keys) {
  return [...keys].sort((a, b) => reportSortValue(a).localeCompare(reportSortValue(b)));
}

function reportSortValue(key) {
  const text = String(key || "");
  const range = text.match(/^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/);
  if (range) return `${range[1]}_${range[2]}`;

  const month = text.match(/^(\d{4}-\d{2})$/);
  if (month) return `${text}-01_${lastDayOfMonth(text)}`;

  return text;
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
  categoryAliases = new Map(
    Object.entries(data?.categoryAliases || {})
      .map(([from, to]) => [String(from || "").trim(), String(to || "").trim()])
      .filter(([from, to]) => from && to && from !== to)
  );
  productCategories = normalizeProductCategoryList(
    Array.isArray(data?.categories) ? data.categories : DEFAULT_PRODUCT_CATEGORIES
  );

  for (const item of data?.mappings || []) {
    const keyword = String(item.keyword || "").trim();
    const categories = mappingCategoriesFromItem(item);
    if (!keyword || !categories.length) continue;
    for (const category of categories) {
      if (!productCategories.includes(category) && category !== "미지정") productCategories.push(category);
    }
    categoryMappings.set(normalizeText(keyword), categoryMappingRecord(keyword, categories));
  }

  if (!productCategories.length) productCategories = [...DEFAULT_PRODUCT_CATEGORIES];
  updateCategoryManagerOptions();
}

async function renderMappingSheet(options = {}) {
  updateCategoryManagerOptions();
  if (!reportKeys.length) {
    mappingRows = [];
    newKeywordRows = [];
    renderMappingSummary();
    mappingStatus.textContent = "저장된 리포트가 없어 매칭할 키워드가 없습니다.";
    mappingBody.innerHTML = `<tr><td colspan="6">저장된 리포트가 없습니다.</td></tr>`;
    mappingApplySuggestionsButton.disabled = true;
    return;
  }

  mappingRefreshButton.disabled = true;
  try {
    if (options.refreshReports) reportCache = new Map();

    const reports = await loadAllReports();
    newKeywordRows = reports.length >= 2 ? buildNewKeywordRows(reports) : [];
    mappingRows = buildMappingRows(reports);
    renderMappingSummary();
    renderMappingRows();
  } finally {
    mappingRefreshButton.disabled = false;
    mappingApplySuggestionsButton.disabled = !newKeywordRows.some((row) => !manualCategoryFor(row.keyword));
  }
}

function buildMappingRows(reports) {
  const byKeyword = new Map();
  const appearanceByKeyword = new Map(newKeywordRows.map((row) => [row.key, row.appearanceType]));

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
        appearanceType: appearanceByKeyword.get(key) || ""
      };
      const endDate = reportEndDate(report);

      existing.monthCount += 1;
      if (!existing.latestEndDate || endDate >= existing.latestEndDate) {
        existing.keyword = row.keyword;
        existing.latestMonth = report.month;
        existing.latestEndDate = endDate;
        existing.latestRank = row.rank;
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

function renderMappingSummary() {
  const firstCount = newKeywordRows.filter((row) => row.appearanceType === "first").length;
  const returningCount = newKeywordRows.filter((row) => row.appearanceType === "returning").length;
  const mappedCount = mappingRows.filter((row) => manualCategoryFor(row.keyword)).length;

  mappingSummary.innerHTML = [
    comparisonMetricHtml("전체 키워드", `${mappingRows.length}개`, "저장 자료 전체의 고유 검색어"),
    comparisonMetricHtml("최초 등장", `${firstCount}개`, "최신 자료에 처음 나타난 검색어"),
    comparisonMetricHtml("재진입", `${returningCount}개`, "직전 자료에서 빠졌다가 다시 나타난 검색어"),
    comparisonMetricHtml("직접 분류 / 카테고리", `${mappedCount} / ${productCategories.length}`, "저장된 직접 매칭과 제품군 수")
  ].join("");
}

function renderMappingRows() {
  const search = normalizeText(mappingSearch.value);
  const filter = mappingFilter.value;
  const rows = mappingRows.filter((row) => {
    const manualCategories = manualCategoriesFor(row.keyword);
    const suggestion = autoProductCategoryFor(row.keyword);
    const mapped = manualCategories.length > 0;
    if (filter === "mapped" && !mapped) return false;
    if (filter === "unmapped" && mapped) return false;
    if (filter === "new" && !row.appearanceType) return false;
    if ((filter === "first" || filter === "returning") && row.appearanceType !== filter) return false;
    return !search
      || normalizeText(row.keyword).includes(search)
      || normalizeText([...manualCategories, suggestion].join(" ")).includes(search);
  });
  const mappedCount = mappingRows.filter((row) => manualCategoryFor(row.keyword)).length;

  mappingStatus.textContent = `총 ${mappingRows.length}개 중 ${rows.length}개 표시 · 직접 분류 ${mappedCount}개 · 신규·재진입 ${newKeywordRows.length}개`;
  mappingBody.replaceChildren();

  if (!rows.length) {
    mappingBody.innerHTML = `<tr><td colspan="6">조건에 맞는 키워드가 없습니다.</td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");
    const keywordCell = document.createElement("td");
    const appearanceCell = document.createElement("td");
    const monthCell = document.createElement("td");
    const rankCell = document.createElement("td");
    const suggestionCell = document.createElement("td");
    const categoryCell = document.createElement("td");
    const categoryInputs = createCategorySearchGroup(row.keyword);

    keywordCell.textContent = row.keyword;
    appearanceCell.innerHTML = row.appearanceType ? newKeywordAppearanceBadge(row.appearanceType) : `<span class="muted-cell">-</span>`;
    monthCell.textContent = row.latestMonth || "-";
    rankCell.textContent = row.latestRank || "-";
    suggestionCell.innerHTML = `<span class="category-suggestion">${escapeHtml(autoProductCategoryFor(row.keyword))}</span>`;
    categoryCell.append(categoryInputs);

    tr.append(keywordCell, appearanceCell, monthCell, rankCell, suggestionCell, categoryCell);
    fragment.append(tr);
  }

  mappingBody.append(fragment);
}

function createCategorySearchGroup(keyword) {
  const group = document.createElement("div");
  group.className = "category-input-group";
  const inputs = [0, 1].map((slot) => {
    const input = document.createElement("input");
    input.type = "search";
    input.className = "category-search-input";
    input.setAttribute("list", "mapping-category-options");
    input.placeholder = slot === 0 ? "1차 카테고리 검색" : "2차 카테고리 검색";
    input.setAttribute("aria-label", `${keyword} ${slot + 1}차 카테고리`);

    const commit = () => commitCategorySearch(keyword, slot, input, inputs);
    input.addEventListener("input", () => {
      input.setCustomValidity("");
      const exact = exactProductCategory(input.value);
      if (exact) commit();
    });
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commit();
    });
    return input;
  });

  group.append(...inputs);
  syncCategorySearchInputs(keyword, inputs);
  return group;
}

function commitCategorySearch(keyword, slot, input, inputs) {
  const query = String(input.value || "").trim();
  const category = query ? resolveCategorySearch(query) : "";
  if (query && !category) {
    input.setCustomValidity("카테고리 후보를 더 입력하거나 자동완성 목록에서 선택해주세요.");
    input.reportValidity();
    return;
  }

  const current = manualCategoriesFor(keyword);
  const otherCategory = current[slot === 0 ? 1 : 0] || "";
  if (category && category === otherCategory) {
    input.setCustomValidity("같은 카테고리를 두 번 지정할 수 없습니다.");
    input.reportValidity();
    return;
  }

  input.setCustomValidity("");
  updateCategoryMapping(keyword, category, slot);
  syncCategorySearchInputs(keyword, inputs);
  renderMappingSummary();
  const mappedCount = mappingRows.filter((row) => manualCategoriesFor(row.keyword).length).length;
  mappingStatus.textContent = `총 ${mappingRows.length}개 · 직접 분류 ${mappedCount}개 · 저장 필요`;
  mappingApplySuggestionsButton.disabled = !newKeywordRows.some((row) => !manualCategoriesFor(row.keyword).length);
}

function syncCategorySearchInputs(keyword, inputs) {
  const categories = manualCategoriesFor(keyword);
  inputs.forEach((input, index) => {
    input.value = categories[index] || "";
    input.title = categories[index] || `${index + 1}차 카테고리 검색`;
  });
}

function exactProductCategory(value) {
  const key = normalizeText(value);
  return productCategories.find((category) => normalizeText(category) === key) || "";
}

function resolveCategorySearch(value) {
  const exact = exactProductCategory(value);
  if (exact) return exact;
  const key = normalizeText(value);
  if (!key) return "";
  const matches = productCategories.filter((category) => normalizeText(category).includes(key));
  return matches.length === 1 ? matches[0] : "";
}

function updateCategoryMapping(keyword, category, slot = 0) {
  const key = normalizeText(keyword);
  if (!key) return;

  const categories = manualCategoriesFor(keyword);
  categories[slot] = category;
  const normalized = normalizeAssignedCategories(categories);
  if (!normalized.length) {
    categoryMappings.delete(key);
    return;
  }

  categoryMappings.set(key, categoryMappingRecord(keyword, normalized));
}

async function saveCategoryMappingsFromSheet() {
  mappingSaveButton.disabled = true;
  mappingStatus.textContent = "카테고리 매칭을 저장하는 중입니다.";

  try {
    const saved = await persistCategoryMappings();
    renderMappingSummary();
    renderMappingRows();
    mappingStatus.textContent = `${saved.categories.length}개 카테고리와 ${saved.mappings.length}개 키워드 매칭을 저장했습니다.`;
  } catch (error) {
    mappingStatus.textContent = error.message;
  } finally {
    mappingSaveButton.disabled = false;
  }
}

async function persistCategoryMappings() {
  const mappings = [...categoryMappings.values()]
    .filter((item) => item.keyword && item.category)
    .sort((a, b) => a.keyword.localeCompare(b.keyword, "ko"));
  const response = await fetch("/api/keyword-category-mappings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categories: productCategories,
      categoryAliases: Object.fromEntries(categoryAliases),
      mappings
    })
  });
  const saved = await response.json();

  if (!response.ok) {
    throw new Error(saved.error || "카테고리 매칭 저장에 실패했습니다.");
  }

  setCategoryMappings(saved);
  return saved;
}

function normalizeProductCategoryList(categories) {
  const unique = new Map();
  for (const item of categories || []) {
    const category = String(item || "").trim();
    if (!category || category === "총합계" || category === "미지정") continue;
    unique.set(normalizeText(category), category);
  }
  return [...unique.values()];
}

function productGroupsWithTotal() {
  return ["총합계", ...productCategories];
}

function resolveCategoryName(value) {
  let category = String(value || "").trim();
  const visited = new Set();

  while (categoryAliases.has(category) && !visited.has(category)) {
    visited.add(category);
    category = categoryAliases.get(category);
  }

  return category;
}

function updateCategoryManagerOptions(preferredCategory = "") {
  const current = preferredCategory || categoryManageSelect.value;
  categoryManageSelect.replaceChildren();
  mappingCategoryOptions.replaceChildren();

  for (const category of productCategories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryManageSelect.append(option);

    const searchOption = document.createElement("option");
    searchOption.value = category;
    mappingCategoryOptions.append(searchOption);
  }

  categoryManageSelect.value = productCategories.includes(current) ? current : productCategories[0] || "";
  categoryRenameInput.value = categoryManageSelect.value;
  categoryRenameButton.disabled = !productCategories.length;
  categoryDeleteButton.disabled = productCategories.length <= 1;
}

function addProductCategory() {
  const category = String(categoryAddInput.value || "").trim();
  if (!category) {
    mappingStatus.textContent = "추가할 카테고리 이름을 입력해주세요.";
    categoryAddInput.focus();
    return;
  }
  if (["총합계", "미지정"].includes(category) || productCategories.some((item) => normalizeText(item) === normalizeText(category))) {
    mappingStatus.textContent = "이미 사용 중이거나 예약된 카테고리 이름입니다.";
    return;
  }

  productCategories.push(category);
  categoryAddInput.value = "";
  updateCategoryManagerOptions(category);
  renderMappingSummary();
  renderMappingRows();
  mappingStatus.textContent = `${category} 카테고리를 추가했습니다. 변경사항 저장을 눌러 확정해주세요.`;
}

function renameProductCategory() {
  const previous = categoryManageSelect.value;
  const next = String(categoryRenameInput.value || "").trim();
  if (!previous || !next || previous === next) return;
  if (["총합계", "미지정"].includes(next) || productCategories.some((item) => item !== previous && normalizeText(item) === normalizeText(next))) {
    mappingStatus.textContent = "이미 사용 중이거나 예약된 카테고리 이름입니다.";
    return;
  }

  productCategories = productCategories.map((category) => category === previous ? next : category);
  for (const [key, item] of categoryMappings) {
    const categories = mappingCategoriesFromItem(item).map((category) => category === previous ? next : category);
    categoryMappings.set(key, categoryMappingRecord(item.keyword, categories));
  }
  for (const [source, target] of categoryAliases) {
    if (target === previous) categoryAliases.set(source, next);
  }
  categoryAliases.set(previous, next);
  selectedTrendSeries = selectedTrendSeries.map((series) => (
    series.type === "category" && series.value === previous ? { ...series, value: next } : series
  ));
  if (selectedStatusCategory === previous) selectedStatusCategory = next;

  saveTrendSeriesSelection();
  updateCategoryManagerOptions(next);
  renderMappingSummary();
  renderMappingRows();
  mappingStatus.textContent = `${previous}을(를) ${next}(으)로 변경했습니다. 변경사항 저장을 눌러 확정해주세요.`;
}

function deleteProductCategory() {
  const category = categoryManageSelect.value;
  if (!category || productCategories.length <= 1) return;
  const mappedCount = [...categoryMappings.values()].filter((item) => mappingCategoriesFromItem(item).includes(category)).length;
  const confirmed = window.confirm(
    `${category} 카테고리를 삭제할까요?\n${mappedCount}개 키워드에서 이 카테고리만 해제되며, 함께 지정된 다른 카테고리는 유지됩니다.`
  );
  if (!confirmed) return;

  productCategories = productCategories.filter((item) => item !== category);
  for (const [key, item] of categoryMappings) {
    const categories = mappingCategoriesFromItem(item).filter((itemCategory) => itemCategory !== category);
    if (categories.length) categoryMappings.set(key, categoryMappingRecord(item.keyword, categories));
    else categoryMappings.delete(key);
  }
  for (const [source, target] of [...categoryAliases]) {
    if (source === category || target === category) categoryAliases.delete(source);
  }
  selectedTrendSeries = selectedTrendSeries.filter((series) => series.type !== "category" || series.value !== category);
  if (selectedStatusCategory === category) selectedStatusCategory = productCategories[0] || "";

  saveTrendSeriesSelection();
  updateCategoryManagerOptions();
  renderMappingSummary();
  renderMappingRows();
  mappingStatus.textContent = `${category} 카테고리를 삭제했습니다. 변경사항 저장을 눌러 확정해주세요.`;
}

function manualCategoryFor(keyword) {
  return manualCategoriesFor(keyword)[0] || "";
}

function manualCategoriesFor(keyword) {
  return mappingCategoriesFromItem(categoryMappings.get(normalizeText(keyword)))
    .filter((category) => productCategories.includes(category));
}

function mappingCategoriesFromItem(item) {
  if (!item) return [];
  const values = Array.isArray(item.categories)
    ? item.categories
    : [item.category, item.secondaryCategory];
  return normalizeAssignedCategories(values.map(resolveCategoryName));
}

function normalizeAssignedCategories(categories) {
  const result = [];
  for (const value of categories || []) {
    const category = String(value || "").trim();
    if (!category || result.some((item) => normalizeText(item) === normalizeText(category))) continue;
    result.push(category);
    if (result.length === 2) break;
  }
  return result;
}

function categoryMappingRecord(keyword, categories) {
  const normalized = normalizeAssignedCategories(categories);
  return {
    keyword,
    category: normalized[0] || "",
    ...(normalized[1] ? { secondaryCategory: normalized[1] } : {})
  };
}

function productCategoriesFor(keyword) {
  const manualCategories = manualCategoriesFor(keyword);
  return manualCategories.length ? manualCategories : [autoProductCategoryFor(keyword)];
}

function formatProductCategories(categories) {
  return normalizeAssignedCategories(categories).join(" · ");
}

function autoProductCategoryFor(keyword) {
  const category = resolveCategoryName(baseAutoProductCategoryFor(keyword));
  if (productCategories.includes(category)) return category;
  return productCategories.includes("기타") ? "기타" : "미지정";
}

function baseAutoProductCategoryFor(keyword) {
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
  if (any(["노인", "노년", "시니어", "실버", "어르신"])) return "노인 건강";
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
  const scores = new Map(productGroupsWithTotal().map((group) => [group, 0]));

  for (const row of rows || []) {
    const score = Number(row.dailyAverageRatio || 0);
    scores.set("총합계", (scores.get("총합계") || 0) + score);
    for (const group of productCategoriesFor(row.keyword)) {
      scores.set(group, (scores.get(group) || 0) + score);
    }
  }

  return scores;
}

function buildNewKeywordRows(reports) {
  const previous = reports[reports.length - 2];
  const latest = reports[reports.length - 1];
  const olderKeys = new Set(
    reports.slice(0, -2).flatMap((report) => (report.rows || []).map((row) => normalizeText(row.keyword)).filter(Boolean))
  );
  const previousKeys = new Set((previous.rows || []).map((row) => normalizeText(row.keyword)).filter(Boolean));
  const latestByKeyword = new Map();

  for (const row of latest.rows || []) {
    const key = normalizeText(row.keyword);
    if (key && !latestByKeyword.has(key)) latestByKeyword.set(key, row);
  }

  return [...latestByKeyword.entries()]
    .filter(([key]) => !previousKeys.has(key))
    .map(([key, row]) => ({
      key,
      keyword: row.keyword,
      rank: Number(row.rank),
      appearanceType: olderKeys.has(key) ? "returning" : "first",
      suggestion: autoProductCategoryFor(row.keyword)
    }))
    .sort((a, b) => a.rank - b.rank || a.keyword.localeCompare(b.keyword, "ko"));
}

function newKeywordAppearanceBadge(type) {
  const label = type === "returning" ? "재진입" : "최초 등장";
  return `<span class="new-keyword-badge ${type}">${label}</span>`;
}

function applyNewKeywordSuggestions() {
  let appliedCount = 0;
  for (const row of newKeywordRows) {
    if (manualCategoryFor(row.keyword)) continue;
    updateCategoryMapping(row.keyword, row.suggestion);
    appliedCount += 1;
  }

  mappingFilter.value = "new";
  renderMappingSummary();
  renderMappingRows();
  mappingStatus.textContent = `${appliedCount}개 신규·재진입 키워드에 자동 추천을 적용했습니다. 변경사항 저장을 눌러 확정해주세요.`;
  mappingApplySuggestionsButton.disabled = true;
}

async function renderCategoryStatusSheet(options = {}) {
  categoryStatusRefreshButton.disabled = true;
  try {
    if (options.refreshReports) reportCache = new Map();
    categoryStatusReports = await loadAllReports();

    if (!categoryStatusReports.length) {
      categoryStatusRows = [];
      categoryStatusSummary.replaceChildren();
      categoryStatusList.innerHTML = `<p class="empty">저장된 자료가 없습니다.</p>`;
      categoryPeriodBody.innerHTML = `<tr><td colspan="4">저장된 자료가 없습니다.</td></tr>`;
      categoryKeywordBody.innerHTML = `<tr><td colspan="4">저장된 자료가 없습니다.</td></tr>`;
      categoryRankChart.innerHTML = `<text x="24" y="40" class="chart-empty">저장된 자료가 없습니다.</text>`;
      categoryRankLegend.replaceChildren();
      return;
    }

    categoryStatusRows = buildCategoryStatusRows(categoryStatusReports);
    if (!categoryStatusRows.some((row) => row.category === selectedStatusCategory)) {
      selectedStatusCategory = categoryStatusRows.find((row) => row.keywords.length)?.category
        || categoryStatusRows[0]?.category
        || "";
    }

    renderCategoryStatusSummary();
    renderCategoryStatusList();
    renderCategoryDetail();
    updateStatusSeriesOptions();
    ensureDefaultTrendSeries();
    renderSelectedTrendSeries();
    renderCategoryRankChart();
  } finally {
    categoryStatusRefreshButton.disabled = false;
  }
}

function buildCategoryStatusRows(reports) {
  const keywordMap = new Map();

  reports.forEach((report, reportIndex) => {
    for (const reportRow of report.rows || []) {
      const key = normalizeText(reportRow.keyword);
      if (!key) continue;
      const manualCategories = manualCategoriesFor(reportRow.keyword);
      const categories = manualCategories.length ? manualCategories : [autoProductCategoryFor(reportRow.keyword)];
      const existing = keywordMap.get(key) || {
        key,
        keyword: reportRow.keyword,
        categories,
        assignmentType: manualCategories.length ? "manual" : categories[0] === "미지정" ? "unmapped" : "automatic",
        periodRanks: Array(reports.length).fill(null),
        latestPeriod: "",
        latestEndDate: "",
        latestRank: null
      };
      const endDate = reportEndDate(report);
      existing.periodRanks[reportIndex] = Number(reportRow.rank) || null;
      if (!existing.latestEndDate || endDate >= existing.latestEndDate) {
        existing.keyword = reportRow.keyword;
        existing.categories = categories;
        existing.assignmentType = manualCategories.length ? "manual" : categories[0] === "미지정" ? "unmapped" : "automatic";
        existing.latestPeriod = report.month;
        existing.latestEndDate = endDate;
        existing.latestRank = Number(reportRow.rank) || null;
      }
      keywordMap.set(key, existing);
    }
  });

  const keywords = [...keywordMap.values()];
  const categories = [...productCategories];
  if (keywords.some((row) => row.categories.includes("미지정"))) categories.push("미지정");

  return categories.map((category) => {
    const categoryKeywords = keywords
      .filter((row) => row.categories.includes(category))
      .sort((a, b) => Number(a.latestRank || 9999) - Number(b.latestRank || 9999) || a.keyword.localeCompare(b.keyword, "ko"));
    const points = reports.map((_, reportIndex) => {
      const ranks = categoryKeywords
        .map((row) => row.periodRanks[reportIndex])
        .filter(Number.isFinite)
        .sort((a, b) => a - b);
      return {
        bestRank: ranks[0] || null,
        top100Count: ranks.filter((rank) => rank <= 100).length,
        top500Count: ranks.length
      };
    });

    return {
      category,
      keywords: categoryKeywords,
      points,
      manualCount: categoryKeywords.filter((row) => row.assignmentType === "manual").length,
      automaticCount: categoryKeywords.filter((row) => row.assignmentType === "automatic").length
    };
  });
}

function allCategoryStatusKeywords() {
  const byKey = new Map();
  for (const category of categoryStatusRows) {
    for (const keyword of category.keywords) byKey.set(keyword.key, keyword);
  }
  return [...byKey.values()];
}

function renderCategoryStatusSummary() {
  const keywords = allCategoryStatusKeywords();
  const manualCount = keywords.filter((row) => row.assignmentType === "manual").length;
  const automaticCount = keywords.filter((row) => row.assignmentType === "automatic").length;
  const unmappedCount = keywords.filter((row) => row.assignmentType === "unmapped").length;

  categoryStatusSummary.innerHTML = [
    comparisonMetricHtml("카테고리", `${productCategories.length}개`, "현재 저장할 수 있는 제품군"),
    comparisonMetricHtml("고유 키워드", `${keywords.length}개`, "저장 자료 전체 기준"),
    comparisonMetricHtml("직접 지정 / 자동", `${manualCount} / ${automaticCount}`, "직접 매칭과 자동 규칙 적용"),
    comparisonMetricHtml("미지정", `${unmappedCount}개`, "카테고리 규칙에 포함되지 않은 키워드")
  ].join("");
}

function renderCategoryStatusList() {
  categoryListCount.textContent = `${categoryStatusRows.length}개`;
  categoryStatusList.replaceChildren();

  for (const row of categoryStatusRows) {
    const latest = row.points[row.points.length - 1] || { bestRank: null, top500Count: 0 };
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-status-button";
    button.classList.toggle("active", row.category === selectedStatusCategory);
    button.innerHTML = `
      <span>${escapeHtml(row.category)}</span>
      <small>${row.keywords.length}개 키워드 · 최신 ${latest.bestRank ? `${latest.bestRank}위` : "진입 없음"}</small>
    `;
    button.addEventListener("click", () => {
      selectedStatusCategory = row.category;
      renderCategoryStatusList();
      renderCategoryDetail();
    });
    categoryStatusList.append(button);
  }
}

function renderCategoryDetail() {
  const row = categoryStatusRows.find((item) => item.category === selectedStatusCategory);
  if (!row) {
    categoryDetailTitle.textContent = "카테고리 선택";
    categoryDetailMeta.textContent = "";
    categoryPeriodBody.innerHTML = `<tr><td colspan="4">카테고리를 선택해주세요.</td></tr>`;
    categoryKeywordBody.innerHTML = `<tr><td colspan="4">카테고리를 선택해주세요.</td></tr>`;
    return;
  }

  categoryDetailTitle.textContent = row.category;
  categoryDetailMeta.textContent = `하부 키워드 ${row.keywords.length}개 · 직접 지정 ${row.manualCount}개 · 자동 규칙 ${row.automaticCount}개`;
  categoryPeriodBody.innerHTML = row.points.map((point, index) => `
    <tr>
      <td>${escapeHtml(periodLabel(categoryStatusReports[index]))}</td>
      <td>${point.bestRank ? `${point.bestRank}위` : "-"}</td>
      <td>${point.top100Count}개</td>
      <td>${point.top500Count}개</td>
    </tr>
  `).join("");
  renderCategoryKeywordRows();
}

function renderCategoryKeywordRows() {
  const row = categoryStatusRows.find((item) => item.category === selectedStatusCategory);
  if (!row) return;
  const search = normalizeText(categoryKeywordSearch.value);
  const keywords = row.keywords.filter((item) => !search || normalizeText(item.keyword).includes(search));

  if (!keywords.length) {
    categoryKeywordBody.innerHTML = `<tr><td colspan="4">조건에 맞는 하부 키워드가 없습니다.</td></tr>`;
    return;
  }

  categoryKeywordBody.innerHTML = keywords.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.keyword)}</strong></td>
      <td>${assignmentBadgeHtml(item.assignmentType)}</td>
      <td>${escapeHtml(periodLabel(item.latestPeriod))}</td>
      <td>${item.latestRank ? `${item.latestRank}위` : "-"}</td>
    </tr>
  `).join("");
}

function assignmentBadgeHtml(type) {
  const labels = { manual: "직접 지정", automatic: "자동 규칙", unmapped: "미지정" };
  return `<span class="assignment-badge ${type}">${labels[type] || "미지정"}</span>`;
}

function updateStatusSeriesOptions() {
  const type = statusSeriesType.value;
  const values = type === "category"
    ? categoryStatusRows.map((row) => row.category)
    : allCategoryStatusKeywords().map((row) => row.keyword).sort((a, b) => a.localeCompare(b, "ko"));

  statusSeriesOptions.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("");
  statusSeriesSearch.placeholder = type === "category" ? "카테고리 검색" : "키워드 검색";
}

function ensureDefaultTrendSeries() {
  const validCategories = new Set(categoryStatusRows.map((row) => row.category));
  const validKeywords = new Set(allCategoryStatusKeywords().map((row) => normalizeText(row.keyword)));
  selectedTrendSeries = selectedTrendSeries.filter((series) => (
    series.type === "category"
      ? validCategories.has(series.value)
      : series.type === "keyword" && validKeywords.has(normalizeText(series.value))
  ));

  if (!selectedTrendSeries.length) {
    selectedTrendSeries = categoryStatusRows
      .filter((row) => row.keywords.length)
      .sort((a, b) => Number(a.points.at(-1)?.bestRank || 9999) - Number(b.points.at(-1)?.bestRank || 9999))
      .slice(0, 5)
      .map((row) => ({ type: "category", value: row.category }));
  }
  saveTrendSeriesSelection();
}

function addTrendSeries() {
  const type = statusSeriesType.value;
  const requested = String(statusSeriesSearch.value || "").trim();
  if (!requested) return;
  const candidates = type === "category"
    ? categoryStatusRows.map((row) => row.category)
    : allCategoryStatusKeywords().map((row) => row.keyword);
  const exact = candidates.find((value) => normalizeText(value) === normalizeText(requested));
  const value = exact || candidates.find((item) => normalizeText(item).includes(normalizeText(requested)));

  if (!value) {
    statusSeriesSearch.setCustomValidity("저장 자료에 있는 항목을 선택해주세요.");
    statusSeriesSearch.reportValidity();
    return;
  }
  statusSeriesSearch.setCustomValidity("");
  if (selectedTrendSeries.some((series) => series.type === type && normalizeText(series.value) === normalizeText(value))) {
    statusSeriesSearch.value = "";
    return;
  }
  if (selectedTrendSeries.length >= 12) {
    statusSeriesSearch.setCustomValidity("그래프에는 최대 12개 항목을 표시할 수 있습니다.");
    statusSeriesSearch.reportValidity();
    return;
  }

  selectedTrendSeries.push({ type, value });
  statusSeriesSearch.value = "";
  saveTrendSeriesSelection();
  renderSelectedTrendSeries();
  renderCategoryRankChart();
}

function removeTrendSeries(index) {
  selectedTrendSeries.splice(index, 1);
  saveTrendSeriesSelection();
  renderSelectedTrendSeries();
  renderCategoryRankChart();
}

function renderSelectedTrendSeries() {
  if (!selectedTrendSeries.length) {
    statusSeriesList.innerHTML = `<p class="empty">표시할 카테고리나 키워드를 추가해주세요.</p>`;
    return;
  }

  statusSeriesList.replaceChildren();
  selectedTrendSeries.forEach((series, index) => {
    const item = document.createElement("span");
    item.className = "selected-series-item";
    const label = document.createElement("span");
    label.textContent = `${series.type === "category" ? "카테고리" : "키워드"} · ${series.value}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.title = `${series.value} 그래프에서 제거`;
    remove.setAttribute("aria-label", remove.title);
    remove.addEventListener("click", () => removeTrendSeries(index));
    item.append(label, remove);
    statusSeriesList.append(item);
  });
}

function trendSeriesPoints(series) {
  if (series.type === "category") {
    return categoryStatusRows.find((row) => row.category === series.value)?.points.map((point) => point.bestRank) || [];
  }

  const keyword = allCategoryStatusKeywords().find((row) => normalizeText(row.keyword) === normalizeText(series.value));
  return keyword?.periodRanks || [];
}

function renderCategoryRankChart() {
  const reports = categoryStatusReports;
  const series = selectedTrendSeries.map((item) => ({ ...item, points: trendSeriesPoints(item) }));
  if (!reports.length || !series.length) {
    categoryRankChart.setAttribute("viewBox", "0 0 920 280");
    categoryRankChart.innerHTML = `<text x="28" y="44" class="chart-empty">표시할 카테고리나 키워드를 추가해주세요.</text>`;
    categoryRankLegend.replaceChildren();
    return;
  }

  const colors = ["#168246", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be123c", "#4d7c0f", "#9333ea", "#0f766e", "#c2410c", "#475569"];
  const width = Math.max(920, reports.length * 128);
  const height = 360;
  const padding = { top: 22, right: 24, bottom: 68, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const observed = series.flatMap((item) => item.points).filter(Number.isFinite);
  const maxObserved = Math.max(50, ...observed);
  const maxRank = Math.min(500, Math.ceil(maxObserved / 50) * 50);
  const x = (index) => padding.left + (reports.length <= 1 ? chartWidth / 2 : chartWidth * index / (reports.length - 1));
  const y = (rank) => padding.top + chartHeight * (Number(rank) - 1) / Math.max(1, maxRank - 1);
  const ticks = [...new Set([1, Math.ceil(maxRank * 0.25), Math.ceil(maxRank * 0.5), Math.ceil(maxRank * 0.75), maxRank])];

  categoryRankChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  categoryRankChart.style.minWidth = `${width}px`;
  categoryRankChart.innerHTML = `
    ${ticks.map((tick) => `
      <line x1="${padding.left}" y1="${y(tick)}" x2="${padding.left + chartWidth}" y2="${y(tick)}" class="rank-grid"></line>
      <text x="${padding.left - 10}" y="${y(tick) + 4}" text-anchor="end" class="axis-label">${tick}위</text>
    `).join("")}
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" class="axis"></line>
    <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" class="axis"></line>
    ${reports.map((report, index) => {
      const [line1, line2] = periodAxisLabelParts(periodLabel(report));
      return `<text x="${x(index)}" y="${height - 34}" text-anchor="middle" class="axis-label"><tspan x="${x(index)}">${escapeHtml(line1)}</tspan>${line2 ? `<tspan x="${x(index)}" dy="13">${escapeHtml(line2)}</tspan>` : ""}</text>`;
    }).join("")}
    ${series.map((item, seriesIndex) => renderRankSeriesSvg(item, seriesIndex, colors[seriesIndex % colors.length], x, y)).join("")}
  `;

  categoryRankLegend.innerHTML = series.map((item, index) => `
    <div class="rank-legend-item">
      <span class="rank-legend-swatch" style="background:${colors[index % colors.length]}"></span>
      <span><strong>${escapeHtml(item.value)}</strong><small>${item.type === "category" ? "카테고리 최고 순위" : "개별 키워드 순위"}</small></span>
    </div>
  `).join("");
}

function renderRankSeriesSvg(series, seriesIndex, color, x, y) {
  const segments = [];
  let current = [];
  series.points.forEach((rank, index) => {
    if (Number.isFinite(rank)) current.push({ rank, index });
    else if (current.length) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length) segments.push(current);

  const paths = segments.map((segment) => {
    const path = segment.map((point, index) => `${index ? "L" : "M"} ${x(point.index)} ${y(point.rank)}`).join(" ");
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5"></path>`;
  }).join("");
  const points = series.points.map((rank, index) => Number.isFinite(rank) ? `
    <circle cx="${x(index)}" cy="${y(rank)}" r="4" fill="${color}">
      <title>${escapeHtml(series.value)} · ${rank}위</title>
    </circle>
  ` : "").join("");
  return `<g data-series-index="${seriesIndex}">${paths}${points}</g>`;
}

function readTrendSeriesSelection() {
  try {
    const value = JSON.parse(localStorage.getItem(CATEGORY_TREND_SELECTION_STORAGE_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((item) => ["category", "keyword"].includes(item?.type) && String(item.value || "").trim()).slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

function saveTrendSeriesSelection() {
  localStorage.setItem(CATEGORY_TREND_SELECTION_STORAGE_KEY, JSON.stringify(selectedTrendSeries));
}

async function renderComparisonSheet(options = {}) {
  initializeComparisonSelection();
  pruneComparisonSelection();
  if (!options.keepPeriodList) {
    renderComparisonPeriodList();
  }

  const selectedKeys = chronologicalReportKeys(reportKeys.filter((key) => comparisonSelectedKeys.has(key)));
  const modeConfig = COMPARISON_MODES[comparisonMode];
  const minimumSelection = modeConfig.monthCount * 2;
  comparisonStatus.textContent = `${reportKeys.length}개 저장 자료 중 ${selectedKeys.length}개 선택 · ${modeConfig.label} 비교`;
  comparisonDownloadButton.disabled = true;
  comparisonEmailCopyButton.disabled = true;

  if (selectedKeys.length < minimumSelection) {
    const message = comparisonMode === "month"
      ? "비교할 기간을 2개 이상 선택해주세요."
      : `${modeConfig.label} 비교에는 완전한 월 자료가 최소 ${minimumSelection}개 필요합니다.`;
    clearComparisonView(message);
    return;
  }

  comparisonStatus.textContent = `${selectedKeys.length}개 저장 자료를 불러와 ${modeConfig.label} 순위를 계산하는 중입니다.`;
  if (options.refreshReports) reportCache = new Map();

  const rawReports = (await Promise.all(selectedKeys.map((key) => fetchReport(key)))).filter(Boolean);
  if (rawReports.length < minimumSelection) {
    clearComparisonView("선택한 자료 중 일부를 불러오지 못했습니다.");
    return;
  }

  const grouped = buildComparisonPeriods(rawReports, comparisonMode);
  const reports = grouped.periods;
  if (reports.length < 2) {
    clearComparisonView(`${modeConfig.label}로 완성되는 비교 기간이 2개 미만입니다. ${grouped.note}`.trim());
    return;
  }

  comparisonReports = reports;
  comparisonKeywordRows = buildComparisonKeywordRows(reports);
  comparisonCategoryRows = buildComparisonCategoryRows(reports, comparisonKeywordRows);
  comparisonLatestChanges = buildLatestRankChanges(reports);

  renderComparisonSummary(reports, comparisonKeywordRows);
  renderComparisonInsights(reports, comparisonCategoryRows, comparisonKeywordRows);
  renderLatestRankChanges(reports, comparisonLatestChanges);
  renderComparisonCategoryTable(reports, comparisonCategoryRows);
  renderComparisonKeywordTableHead(reports);
  renderComparisonKeywordRows();

  const first = reports[0];
  const previous = reports[reports.length - 2];
  const latest = reports[reports.length - 1];
  comparisonRangeLabel.textContent = `키워드 ${periodLabel(previous)} 대비 ${periodLabel(latest)} · 제품군 증감 ${periodLabel(first)} 대비 ${periodLabel(latest)} · ${comparisonMethodText(comparisonMode)}`;
  comparisonStatus.textContent = `${selectedKeys.length}개 저장 자료로 ${reports.length}개 ${modeConfig.label} 기간 비교 중 · ${grouped.note}`;
  comparisonDownloadButton.disabled = false;
  comparisonEmailCopyButton.disabled = false;
}

function readComparisonMode() {
  try {
    const saved = localStorage.getItem(COMPARISON_MODE_STORAGE_KEY);
    return COMPARISON_MODES[saved] ? saved : "month";
  } catch {
    return "month";
  }
}

function updateComparisonModeButtons() {
  for (const button of comparisonModeButtons) {
    const active = button.dataset.comparisonMode === comparisonMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function comparisonMethodText(mode = comparisonMode) {
  if (mode === "month") {
    return "월별 저장 자료의 검색 순위를 직접 비교하며 기간별 상대 점수는 사용하지 않습니다.";
  }

  const config = COMPARISON_MODES[mode];
  return `${config.monthCount}개 구성 월의 검색 순위를 평균합니다. 해당 월에 없는 키워드는 501위로 반영한 뒤 묶음 기간 안에서 다시 1~500위 순위를 부여하며 상대 점수는 사용하지 않습니다.`;
}

function buildComparisonPeriods(reports, mode) {
  const sortedReports = [...reports].sort((a, b) => reportEndDate(a).localeCompare(reportEndDate(b)));
  if (mode === "month") {
    return {
      periods: sortedReports,
      note: "월별 검색 순위 기준 · 상대 점수 미사용"
    };
  }

  const monthReports = new Map();
  let excludedCount = 0;
  for (const report of sortedReports) {
    const monthInfo = completeCalendarMonthInfo(report);
    if (!monthInfo) {
      excludedCount += 1;
      continue;
    }
    monthReports.set(monthInfo.monthKey, report);
  }

  const groupDefinitions = new Map();
  for (const monthKey of monthReports.keys()) {
    const definition = comparisonGroupDefinition(monthKey, mode);
    if (definition) groupDefinitions.set(definition.key, definition);
  }

  const periods = [];
  let incompleteCount = 0;
  for (const definition of [...groupDefinitions.values()].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    const sourceReports = definition.monthKeys.map((monthKey) => monthReports.get(monthKey));
    if (sourceReports.some((report) => !report)) {
      incompleteCount += 1;
      continue;
    }
    periods.push(aggregateRankingPeriod(definition, sourceReports));
  }

  const notes = [`완성된 ${COMPARISON_MODES[mode].label} ${periods.length}개`];
  if (incompleteCount) notes.push(`월이 빠진 묶음 ${incompleteCount}개 제외`);
  if (excludedCount) notes.push(`완전한 달력 월이 아닌 자료 ${excludedCount}개 제외`);
  notes.push("상대 점수 미사용");
  return { periods, note: notes.join(" · ") };
}

function completeCalendarMonthInfo(report) {
  const startDate = String(report.startDate || "");
  const endDate = String(report.endDate || "");
  const match = startDate.match(/^(\d{4})-(\d{2})-01$/);
  if (!match) return null;

  const monthKey = `${match[1]}-${match[2]}`;
  if (endDate !== lastDayOfMonth(monthKey)) return null;
  return { monthKey, year: Number(match[1]), month: Number(match[2]) };
}

function comparisonGroupDefinition(monthKey, mode) {
  const match = String(monthKey).match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  let startMonth;
  let monthCount;
  let key;
  let label;

  if (mode === "quarter") {
    const quarter = Math.floor((month - 1) / 3) + 1;
    startMonth = (quarter - 1) * 3 + 1;
    monthCount = 3;
    key = `${year}-Q${quarter}`;
    label = `${year}년 ${quarter}분기`;
  } else if (mode === "half") {
    const half = month <= 6 ? 1 : 2;
    startMonth = half === 1 ? 1 : 7;
    monthCount = 6;
    key = `${year}-H${half}`;
    label = `${year}년 ${half === 1 ? "상반기" : "하반기"}`;
  } else if (mode === "year") {
    startMonth = 1;
    monthCount = 12;
    key = String(year);
    label = `${year}년`;
  } else {
    return null;
  }

  const monthKeys = Array.from({ length: monthCount }, (_, index) => `${year}-${String(startMonth + index).padStart(2, "0")}`);
  const startDate = `${monthKeys[0]}-01`;
  const endDate = lastDayOfMonth(monthKeys[monthKeys.length - 1]);
  return { key, label, monthKeys, startDate, endDate };
}

function aggregateRankingPeriod(definition, sourceReports) {
  const reportMaps = sourceReports.map((report) => new Map(
    (report.rows || [])
      .map((row) => [normalizeText(row.keyword), row])
      .filter(([key]) => key)
  ));
  const keys = new Set(reportMaps.flatMap((rows) => [...rows.keys()]));
  const rankedRows = [...keys].map((key) => {
    const points = reportMaps.map((rows) => rows.get(key) || null);
    const ranks = points.map((row) => row ? Number(row.rank) : MISSING_MONTH_RANK);
    const keyword = [...points].reverse().find(Boolean)?.keyword || key;
    return {
      keyword,
      averageMonthlyRank: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length,
      presentMonthCount: points.filter(Boolean).length,
      latestMonthlyRank: Number([...points].reverse().find(Boolean)?.rank || MISSING_MONTH_RANK)
    };
  }).sort((a, b) =>
    a.averageMonthlyRank - b.averageMonthlyRank
    || b.presentMonthCount - a.presentMonthCount
    || a.latestMonthlyRank - b.latestMonthlyRank
    || a.keyword.localeCompare(b.keyword, "ko")
  ).slice(0, 500).map((row, index) => ({
    rank: index + 1,
    keyword: row.keyword,
    dailyAverageRatio: 0,
    averageMonthlyRank: Number(row.averageMonthlyRank.toFixed(3)),
    presentMonthCount: row.presentMonthCount
  }));

  return {
    month: definition.key,
    comparisonLabel: definition.label,
    startDate: definition.startDate,
    endDate: definition.endDate,
    count: rankedRows.length,
    rows: rankedRows,
    sourceMonthCount: sourceReports.length,
    categoryPath: sourceReports.at(-1)?.categoryPath || []
  };
}

function initializeComparisonSelection() {
  if (comparisonSelectionLoaded) return;
  comparisonSelectionLoaded = true;

  const saved = localStorage.getItem(COMPARISON_SELECTION_STORAGE_KEY);
  if (saved !== null) {
    try {
      const keys = JSON.parse(saved);
      comparisonSelectedKeys = new Set(Array.isArray(keys) ? keys : []);
      return;
    } catch {
      comparisonSelectedKeys = new Set();
    }
  }

  const chronological = chronologicalReportKeys(reportKeys);
  comparisonSelectedKeys = new Set(chronological.slice(-2));
}

function pruneComparisonSelection() {
  const validKeys = new Set(reportKeys);
  const nextKeys = [...comparisonSelectedKeys].filter((key) => validKeys.has(key));
  if (nextKeys.length === comparisonSelectedKeys.size) return;

  comparisonSelectedKeys = new Set(nextKeys);
  saveComparisonSelection();
}

function saveComparisonSelection() {
  localStorage.setItem(COMPARISON_SELECTION_STORAGE_KEY, JSON.stringify([...comparisonSelectedKeys]));
}

function renderComparisonPeriodList() {
  comparisonPeriodList.replaceChildren();

  if (!reportKeys.length) {
    comparisonPeriodList.innerHTML = `<p class="empty">저장된 자료가 없습니다.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const key of reportKeys) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");

    label.className = "comparison-period-option";
    input.type = "checkbox";
    input.dataset.reportKey = key;
    input.checked = comparisonSelectedKeys.has(key);
    text.textContent = periodLabel(key);
    label.append(input, text);
    fragment.append(label);
  }

  comparisonPeriodList.append(fragment);
}

function initializeExecutivePeriodSelection() {
  if (executivePeriodSelectionLoaded && (executiveBaselineKeys.size || executiveCurrentKeys.size)) return;
  executivePeriodSelectionLoaded = true;
  const chronological = chronologicalReportKeys(reportKeys);
  executiveBaselineKeys = new Set(chronological.slice(-2, -1));
  executiveCurrentKeys = new Set(chronological.slice(-1));
}

function refreshExecutivePeriodLists() {
  initializeExecutivePeriodSelection();
  pruneExecutivePeriodSelection();
  renderExecutivePeriodLists();
}

function pruneExecutivePeriodSelection() {
  const validKeys = new Set(reportKeys);
  executiveBaselineKeys = new Set([...executiveBaselineKeys].filter((key) => validKeys.has(key)));
  executiveCurrentKeys = new Set([...executiveCurrentKeys].filter((key) => validKeys.has(key)));
  updateExecutiveReportState();
}

function renderExecutivePeriodLists() {
  renderExecutivePeriodList(executiveBaselinePeriods, executiveBaselineKeys, "baseline");
  renderExecutivePeriodList(executiveCurrentPeriods, executiveCurrentKeys, "current");
  updateExecutiveReportState();
}

function renderExecutivePeriodList(container, selectedKeys, group) {
  container.replaceChildren();
  if (!reportKeys.length) {
    container.innerHTML = `<p class="empty">저장된 자료가 없습니다.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const key of reportKeys) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    label.className = "executive-period-option";
    input.type = "checkbox";
    input.dataset.executiveGroup = group;
    input.dataset.reportKey = key;
    input.checked = selectedKeys.has(key);
    text.textContent = periodLabel(key);
    label.append(input, text);
    fragment.append(label);
  }
  container.append(fragment);
}

function updateExecutivePeriodSelection(event, targetSet) {
  const input = event.target.closest("input[data-report-key]");
  if (!input) return;
  if (input.checked) targetSet.add(input.dataset.reportKey);
  else targetSet.delete(input.dataset.reportKey);
  updateExecutiveReportState();
}

function updateExecutiveReportState() {
  const baseline = chronologicalReportKeys([...executiveBaselineKeys]);
  const current = chronologicalReportKeys([...executiveCurrentKeys]);
  const overlap = baseline.filter((key) => executiveCurrentKeys.has(key));
  const baselineEnd = baseline.length ? reportSortValue(baseline.at(-1)) : "";
  const currentStart = current.length ? reportSortValue(current[0]) : "";
  const valid = baseline.length > 0 && current.length > 0 && !overlap.length && baselineEnd < currentStart;
  executivePdfDownloadButton.disabled = !valid;

  if (!baseline.length || !current.length) {
    executiveReportStatus.textContent = "두 구간에 저장 자료를 각각 1개 이상 선택해주세요.";
  } else if (overlap.length) {
    executiveReportStatus.textContent = "같은 저장 자료를 두 구간에 중복 선택할 수 없습니다.";
  } else if (baselineEnd >= currentStart) {
    executiveReportStatus.textContent = "첫 번째 기간은 두 번째 기간보다 앞선 자료로 구성해주세요.";
  } else {
    executiveReportStatus.textContent = `기준 ${baseline.length}개 자료와 비교 ${current.length}개 자료를 순위 기준으로 분석합니다.`;
  }
}

async function downloadExecutivePdf() {
  if (executivePdfDownloadButton.disabled) return;
  const baselineKeys = chronologicalReportKeys([...executiveBaselineKeys]);
  const currentKeys = chronologicalReportKeys([...executiveCurrentKeys]);
  executivePdfDownloadButton.disabled = true;
  const originalText = executivePdfDownloadButton.textContent;
  executivePdfDownloadButton.textContent = "PDF 작성 중";
  executiveReportStatus.textContent = "선택한 두 구간의 순위를 분석해 보고서를 작성하고 있습니다.";

  try {
    const [baselineReports, currentReports] = await Promise.all([
      Promise.all(baselineKeys.map((key) => fetchReport(key))),
      Promise.all(currentKeys.map((key) => fetchReport(key)))
    ]);
    const prepareReports = (reports) => reports.filter(Boolean).map((report) => ({
      month: report.month,
      startDate: report.startDate,
      endDate: report.endDate,
      rows: (report.rows || []).map((row) => ({
        rank: Number(row.rank),
        keyword: row.keyword,
        categories: productCategoriesFor(row.keyword)
      }))
    }));
    const response = await fetch("/api/executive-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baselineReports: prepareReports(baselineReports),
        currentReports: prepareReports(currentReports)
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "경영진 PDF 생성에 실패했습니다.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `health_market_${safeFileName(baselineKeys[0])}_${safeFileName(currentKeys.at(-1))}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    executiveReportStatus.textContent = "경영진 인사이트 PDF를 생성했습니다.";
  } catch (error) {
    executiveReportStatus.textContent = error.message;
  } finally {
    executivePdfDownloadButton.textContent = originalText;
    updateExecutiveReportState();
  }
}

function clearComparisonView(message) {
  comparisonReports = [];
  comparisonCategoryRows = [];
  comparisonKeywordRows = [];
  comparisonLatestChanges = [];
  comparisonSummary.replaceChildren();
  comparisonStatus.textContent = message;
  comparisonInsights.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
  comparisonRangeLabel.textContent = "";
  comparisonLatestStatus.textContent = message;
  comparisonLatestSummary.replaceChildren();
  comparisonLatestBody.innerHTML = `<tr><td colspan="6">${escapeHtml(message)}</td></tr>`;
  comparisonCategoryHead.innerHTML = "";
  comparisonCategoryBody.innerHTML = `<tr><td>${escapeHtml(message)}</td></tr>`;
  comparisonKeywordHead.innerHTML = "";
  comparisonKeywordBody.innerHTML = `<tr><td>${escapeHtml(message)}</td></tr>`;
  comparisonKeywordStatus.textContent = message;
  comparisonDownloadButton.disabled = true;
  comparisonEmailCopyButton.disabled = true;
}

function buildComparisonCategoryRows(reports, keywordRows) {
  const categories = [...productCategories];
  if (keywordRows.some((row) => row.categories.includes("미지정"))) categories.push("미지정");
  const rows = categories
    .map((category) => {
      const points = reports.map((_, reportIndex) => {
        const ranks = keywordRows
          .filter((row) => row.categories.includes(category) && row.points[reportIndex])
          .map((row) => Number(row.points[reportIndex].rank))
          .filter(Number.isFinite)
          .sort((a, b) => a - b);

        return {
          bestRank: ranks[0] || null,
          top100Count: ranks.filter((rank) => rank <= 100).length,
          top500Count: ranks.length
        };
      });
      const first = points[0];
      const latest = points[points.length - 1];

      return {
        category,
        points,
        first,
        latest,
        bestRankDelta: first.bestRank && latest.bestRank ? first.bestRank - latest.bestRank : null,
        top100Delta: latest.top100Count - first.top100Count,
        top500Delta: latest.top500Count - first.top500Count
      };
    })
    .filter((row) => row.points.some((point) => point.top500Count > 0));

  return rows.sort((a, b) => {
    if (a.latest.bestRank && !b.latest.bestRank) return -1;
    if (!a.latest.bestRank && b.latest.bestRank) return 1;
    return Number(a.latest.bestRank || a.first.bestRank || 9999) - Number(b.latest.bestRank || b.first.bestRank || 9999);
  });
}

function buildComparisonKeywordRows(reports) {
  const reportMaps = reports.map((report) => {
    const rows = new Map();
    for (const row of report.rows || []) {
      const key = normalizeText(row.keyword);
      if (key) rows.set(key, row);
    }
    return rows;
  });
  const keys = new Set(reportMaps.flatMap((rows) => [...rows.keys()]));

  return [...keys].map((key) => {
    const points = reportMaps.map((rows) => rows.get(key) || null);
    const previous = points[points.length - 2];
    const latest = points[points.length - 1];
    const keyword = latest?.keyword || previous?.keyword || [...points].reverse().find(Boolean)?.keyword || key;
    const rankDelta = previous && latest ? Number(previous.rank) - Number(latest.rank) : null;
    const categories = productCategoriesFor(keyword);

    return {
      key,
      keyword,
      categories,
      category: formatProductCategories(categories),
      points,
      previous,
      latest,
      rankDelta,
      changeType: keywordChangeType(points, previous, latest, rankDelta)
    };
  }).sort((a, b) => {
    if (a.latest && !b.latest) return -1;
    if (!a.latest && b.latest) return 1;
    return Number(a.latest?.rank || a.previous?.rank || 9999) - Number(b.latest?.rank || b.previous?.rank || 9999);
  });
}

function keywordChangeType(points, previous, latest, rankDelta) {
  if (!previous && !latest && points.some(Boolean)) return "intermediate";
  if (!previous && latest) return "new";
  if (previous && !latest) return "exited";
  if (rankDelta > 0) return "rising";
  if (rankDelta < 0) return "falling";
  return "unchanged";
}

function buildLatestRankChanges(reports) {
  if (reports.length < 2) return [];

  const previous = reports[reports.length - 2];
  const latest = reports[reports.length - 1];
  const previousRows = new Map((previous.rows || []).map((row) => [normalizeText(row.keyword), row]));
  const latestRows = new Map((latest.rows || []).map((row) => [normalizeText(row.keyword), row]));
  const keys = new Set([...previousRows.keys(), ...latestRows.keys()]);
  const changes = [];

  for (const key of keys) {
    const previousRow = previousRows.get(key) || null;
    const latestRow = latestRows.get(key) || null;
    const keyword = latestRow?.keyword || previousRow?.keyword || key;

    if (previousRow && latestRow) {
      const rankDelta = Number(previousRow.rank) - Number(latestRow.rank);
      if (Math.abs(rankDelta) < LATEST_RANK_CHANGE_THRESHOLD) continue;
      changes.push({
        keyword,
        category: formatProductCategories(productCategoriesFor(keyword)),
        previousRank: Number(previousRow.rank),
        latestRank: Number(latestRow.rank),
        rankDelta,
        changeType: rankDelta > 0 ? "rising" : "falling"
      });
      continue;
    }

    changes.push({
      keyword,
      category: formatProductCategories(productCategoriesFor(keyword)),
      previousRank: previousRow ? Number(previousRow.rank) : null,
      latestRank: latestRow ? Number(latestRow.rank) : null,
      rankDelta: null,
      changeType: latestRow ? "new" : "exited"
    });
  }

  const typeOrder = { rising: 0, falling: 1, new: 2, exited: 3 };
  return changes.sort((a, b) => {
    const typeDifference = typeOrder[a.changeType] - typeOrder[b.changeType];
    if (typeDifference) return typeDifference;
    if (a.changeType === "rising") return b.rankDelta - a.rankDelta;
    if (a.changeType === "falling") return a.rankDelta - b.rankDelta;
    return Number(a.latestRank || a.previousRank || 9999) - Number(b.latestRank || b.previousRank || 9999);
  });
}

function renderLatestRankChanges(reports, changes) {
  const previous = reports[reports.length - 2];
  const latest = reports[reports.length - 1];
  const counts = {
    rising: changes.filter((row) => row.changeType === "rising").length,
    falling: changes.filter((row) => row.changeType === "falling").length,
    new: changes.filter((row) => row.changeType === "new").length,
    exited: changes.filter((row) => row.changeType === "exited").length
  };

  comparisonLatestStatus.textContent = `${periodLabel(previous)} 대비 ${periodLabel(latest)} · 총 ${changes.length}개`;
  comparisonLatestSummary.innerHTML = [
    latestChangeStatHtml(`${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급상승`, counts.rising, "positive"),
    latestChangeStatHtml(`${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급락`, counts.falling, "negative"),
    latestChangeStatHtml("신규 Top 500", counts.new, "positive"),
    latestChangeStatHtml("Top 500 이탈", counts.exited, "negative")
  ].join("");

  if (!changes.length) {
    comparisonLatestBody.innerHTML = `<tr><td colspan="6">조건에 해당하는 최신 순위 변화가 없습니다.</td></tr>`;
    return;
  }

  comparisonLatestBody.innerHTML = changes.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.keyword)}</strong></td>
      <td>${escapeHtml(row.category)}</td>
      <td>${row.previousRank || "-"}</td>
      <td>${row.latestRank || "-"}</td>
      <td class="${deltaClass(row.rankDelta)}">${row.rankDelta == null ? "-" : formatRankDelta(row.rankDelta)}</td>
      <td>${changeBadgeHtml(row.changeType)}</td>
    </tr>
  `).join("");
}

function latestChangeStatHtml(label, count, className) {
  return `
    <div class="latest-change-stat">
      <span>${escapeHtml(label)}</span>
      <strong class="${className}">${count}개</strong>
    </div>
  `;
}

function renderComparisonSummary(reports, keywordRows) {
  const commonCount = keywordRows.filter((row) => row.previous && row.latest).length;
  const newCount = keywordRows.filter((row) => row.changeType === "new").length;
  const exitedCount = keywordRows.filter((row) => row.changeType === "exited").length;
  const risingCount = keywordRows.filter((row) => row.changeType === "rising").length;
  const fallingCount = keywordRows.filter((row) => row.changeType === "falling").length;

  comparisonSummary.innerHTML = [
    comparisonMetricHtml(`${COMPARISON_MODES[comparisonMode].label} 비교 기간`, `${reports.length}개`, `${periodLabel(reports[0])}부터`),
    comparisonMetricHtml("공통 검색어", `${commonCount}개`, "직전·최신 기간 모두 Top 500"),
    comparisonMetricHtml("개별 검색어 신규 / 이탈", `${newCount} / ${exitedCount}`, "직전·최신 기간의 동일 문구 기준"),
    comparisonMetricHtml("순위 상승 / 하락", `${risingCount} / ${fallingCount}`, "직전·최신 기간 검색 순위 기준")
  ].join("");
}

function comparisonMetricHtml(label, value, detail, className = "") {
  return `
    <div class="comparison-metric">
      <span>${escapeHtml(label)}</span>
      <strong class="${className}">${escapeHtml(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function renderComparisonInsights(reports, categoryRows, keywordRows) {
  const rankWinner = keywordRows
    .filter((row) => row.rankDelta > 0)
    .sort((a, b) => b.rankDelta - a.rankDelta)[0];
  const bestNew = keywordRows
    .filter((row) => row.changeType === "new")
    .sort((a, b) => Number(a.latest?.rank || 9999) - Number(b.latest?.rank || 9999))[0];
  const broadeningCategory = categoryRows
    .filter((row) => row.top100Delta > 0 || row.top500Delta > 0)
    .sort((a, b) => b.top100Delta - a.top100Delta || b.top500Delta - a.top500Delta)[0];

  const rankInsight = rankWinner
    ? `<strong>최대 순위 상승</strong>${escapeHtml(rankWinner.keyword)}이 ${rankWinner.rankDelta}위 상승했습니다.`
    : `<strong>순위 상승</strong>직전·최신 기간에 공통으로 등장하며 순위가 오른 검색어가 없습니다.`;
  const newInsight = bestNew
    ? `<strong>신규 진입 최고 순위</strong>${escapeHtml(bestNew.keyword)}이 ${bestNew.latest.rank}위로 진입했습니다.`
    : `<strong>신규 진입</strong>마지막 기간에 새로 Top 500에 진입한 검색어가 없습니다.`;
  const categoryInsight = broadeningCategory
    ? `<strong>상위권 확장 제품군</strong>${escapeHtml(broadeningCategory.category)}의 Top 100 키워드가 ${formatCountDelta(broadeningCategory.top100Delta)}개, Top 500 키워드가 ${formatCountDelta(broadeningCategory.top500Delta)}개 변했습니다.`
    : `<strong>제품군 분포</strong>Top 100 또는 Top 500 키워드 수가 늘어난 제품군이 없습니다.`;

  comparisonInsights.innerHTML = [rankInsight, newInsight, categoryInsight]
    .map((content) => `<div class="comparison-insight">${content}</div>`)
    .join("");
}

function renderComparisonCategoryTable(reports, rows) {
  comparisonCategoryHead.innerHTML = `
    <tr>
      <th>제품군</th>
      ${reports.map((report) => `<th>${periodHeadingHtml(report)}</th>`).join("")}
      <th>최고순위 변동</th>
      <th>Top 100 증감</th>
      <th>Top 500 증감</th>
    </tr>
  `;
  comparisonCategoryBody.innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.category)}</strong></td>
      ${row.points.map(categoryPeriodHtml).join("")}
      <td class="${categoryRankChangeClass(row)}">${formatCategoryRankChange(row)}</td>
      <td class="${deltaClass(row.top100Delta)}">${formatCountDelta(row.top100Delta)}개</td>
      <td class="${deltaClass(row.top500Delta)}">${formatCountDelta(row.top500Delta)}개</td>
    </tr>
  `).join("");
}

function categoryPeriodHtml(point) {
  return `
    <td>
      <span class="category-period-value">
        <strong>${point.bestRank ? `최고 ${point.bestRank}위` : "진입 없음"}</strong>
        <small>Top 100 ${point.top100Count}개 · Top 500 ${point.top500Count}개</small>
      </span>
    </td>
  `;
}

function formatCategoryRankChange(row) {
  if (!row.first.bestRank && row.latest.bestRank) return "신규 진입";
  if (row.first.bestRank && !row.latest.bestRank) return "Top 500 이탈";
  return row.bestRankDelta == null ? "-" : formatRankDelta(row.bestRankDelta);
}

function categoryRankChangeClass(row) {
  if (!row.first.bestRank && row.latest.bestRank) return "positive";
  if (row.first.bestRank && !row.latest.bestRank) return "negative";
  return deltaClass(row.bestRankDelta);
}

function renderComparisonKeywordTableHead(reports) {
  const latestReports = reports.slice(-2);
  comparisonKeywordHead.innerHTML = `
    <tr>
      <th>검색어</th>
      <th>제품군</th>
      ${latestReports.map((report) => `<th>${periodHeadingHtml(report)}<br>검색 순위</th>`).join("")}
      <th>순위 변동</th>
      <th>상태</th>
    </tr>
  `;
}

function renderComparisonKeywordRows() {
  if (!comparisonReports.length) return;

  const search = normalizeText(comparisonKeywordSearch.value);
  const filter = comparisonKeywordFilter.value;
  const comparableRows = comparisonKeywordRows.filter((row) => row.previous || row.latest);
  const rows = comparableRows.filter((row) => {
    if (filter !== "all" && row.changeType !== filter) return false;
    return !search || normalizeText(row.keyword).includes(search) || normalizeText(row.category).includes(search);
  });

  const previousReport = comparisonReports[comparisonReports.length - 2];
  const latestReport = comparisonReports[comparisonReports.length - 1];
  comparisonKeywordStatus.textContent = `${periodLabel(previousReport)} 대비 ${periodLabel(latestReport)} · 전체 ${comparableRows.length}개 중 ${rows.length}개 표시`;
  if (!rows.length) {
    comparisonKeywordBody.innerHTML = `<tr><td colspan="6">조건에 맞는 키워드가 없습니다.</td></tr>`;
    return;
  }

  comparisonKeywordBody.innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.keyword)}</strong></td>
      <td>${escapeHtml(row.category)}</td>
      ${row.points.slice(-2).map((point) => `<td>${point ? Number(point.rank) : "-"}</td>`).join("")}
      <td class="${deltaClass(row.rankDelta)}">${row.rankDelta == null ? "-" : formatRankDelta(row.rankDelta)}</td>
      <td>${changeBadgeHtml(row.changeType)}</td>
    </tr>
  `).join("");
}

function periodHeadingHtml(report) {
  const label = report.comparisonLabel ? `<strong>${escapeHtml(report.comparisonLabel)}</strong><br>` : "";
  return `<span class="comparison-period-heading">${label}${escapeHtml(report.startDate || "")}<br>~ ${escapeHtml(report.endDate || "")}</span>`;
}

function formatRankDelta(value) {
  const number = Number(value || 0);
  if (!number) return "0";
  return `${number > 0 ? "+" : ""}${number}위`;
}

function formatCountDelta(value) {
  const number = Number(value || 0);
  if (!number) return "0";
  return `${number > 0 ? "+" : ""}${number}`;
}

function deltaClass(value) {
  const number = Number(value || 0);
  return number > 0 ? "positive" : number < 0 ? "negative" : "";
}

function changeBadgeHtml(type) {
  const labels = {
    new: "신규 진입",
    rising: "순위 상승",
    falling: "순위 하락",
    exited: "Top 500 이탈",
    intermediate: "중간 기간만",
    unchanged: "변동 없음"
  };
  const className = type === "new" || type === "rising" ? "positive" : type === "falling" || type === "exited" ? "negative" : "";
  return `<span class="change-badge ${className}">${labels[type] || labels.unchanged}</span>`;
}

function downloadComparisonXlsx() {
  if (comparisonReports.length < 2) return;

  const periodLabels = comparisonReports.map((report) => periodLabel(report));
  const rows = [
    [`건강식품 ${COMPARISON_MODES[comparisonMode].label} 검색 순위 비교`],
    ["비교 단위", COMPARISON_MODES[comparisonMode].label],
    ["비교 범위", periodLabels[0], periodLabels[periodLabels.length - 1]],
    ["비교 기준", "검색 순위", comparisonMethodText(comparisonMode)],
    [],
    [
      "제품군",
      ...comparisonReports.flatMap((report) => [
        `${periodLabel(report)} 최고순위`,
        `${periodLabel(report)} Top 100 키워드 수`,
        `${periodLabel(report)} Top 500 키워드 수`
      ]),
      "최고순위 변동",
      "Top 100 증감",
      "Top 500 증감"
    ],
    ...comparisonCategoryRows.map((row) => [
      row.category,
      ...row.points.flatMap((point) => [point.bestRank || "", point.top100Count, point.top500Count]),
      row.bestRankDelta == null ? formatCategoryRankChange(row) : row.bestRankDelta,
      row.top100Delta,
      row.top500Delta
    ]),
    [],
    ["최신 기간 주요 순위 변화"],
    ["비교 구간", periodLabels[periodLabels.length - 2], periodLabels[periodLabels.length - 1]],
    ["검색어", "제품군", "이전 순위", "최신 순위", "순위 변동", "상태"],
    ...comparisonLatestChanges.map((row) => [
      row.keyword,
      row.category,
      row.previousRank || "",
      row.latestRank || "",
      row.rankDelta == null ? "" : row.rankDelta,
      ({ new: "신규 Top 500", rising: `${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급상승`, falling: `${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급락`, exited: "Top 500 이탈" })[row.changeType]
    ]),
    [],
    [
      "검색어",
      "제품군",
      ...comparisonReports.slice(-2).map((report) => `${periodLabel(report)} 검색 순위`),
      "순위 변동",
      "상태"
    ],
    ...comparisonKeywordRows.filter((row) => row.previous || row.latest).map((row) => [
      row.keyword,
      row.category,
      ...row.points.slice(-2).map((point) => point ? Number(point.rank) : ""),
      row.rankDelta == null ? "" : row.rankDelta,
      ({ new: "신규 진입", rising: "순위 상승", falling: "순위 하락", exited: "Top 500 이탈", intermediate: "중간 기간만", unchanged: "변동 없음" })[row.changeType]
    ])
  ];
  const blob = createXlsxBlob("기간별 비교", rows);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comparison_${comparisonMode}_${safeFileName(comparisonReports[0].month)}_${safeFileName(comparisonReports.at(-1).month)}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyComparisonEmail() {
  if (comparisonReports.length < 2) return;

  comparisonEmailCopyButton.disabled = true;
  const originalText = comparisonEmailCopyButton.textContent;
  try {
    const content = buildComparisonEmailContent();
    await writeRichClipboard(content.html, content.text);
    comparisonEmailCopyButton.textContent = "복사 완료";
    comparisonStatus.textContent = "메일 본문을 서식과 함께 복사했습니다. Outlook의 새 메일 본문에 붙여넣으세요.";
  } catch (error) {
    comparisonEmailCopyButton.textContent = "복사 실패";
    comparisonStatus.textContent = error.message || "메일 본문을 복사하지 못했습니다.";
  } finally {
    window.setTimeout(() => {
      comparisonEmailCopyButton.textContent = originalText;
      comparisonEmailCopyButton.disabled = comparisonReports.length < 2;
    }, 1800);
  }
}

function buildComparisonEmailContent() {
  const previous = comparisonReports[comparisonReports.length - 2];
  const latest = comparisonReports[comparisonReports.length - 1];
  const comparableRows = comparisonKeywordRows.filter((row) => row.previous || row.latest);
  const counts = {
    common: comparableRows.filter((row) => row.previous && row.latest).length,
    new: comparableRows.filter((row) => row.changeType === "new").length,
    exited: comparableRows.filter((row) => row.changeType === "exited").length,
    rising: comparableRows.filter((row) => row.changeType === "rising").length,
    falling: comparableRows.filter((row) => row.changeType === "falling").length
  };
  const latestCounts = {
    rising: comparisonLatestChanges.filter((row) => row.changeType === "rising").length,
    falling: comparisonLatestChanges.filter((row) => row.changeType === "falling").length,
    new: comparisonLatestChanges.filter((row) => row.changeType === "new").length,
    exited: comparisonLatestChanges.filter((row) => row.changeType === "exited").length
  };
  const title = `건강식품 ${COMPARISON_MODES[comparisonMode].label} 검색 순위 비교`;
  const range = `${periodLabel(comparisonReports[0])} → ${periodLabel(latest)}`;
  const latestRange = `${periodLabel(previous)} 대비 ${periodLabel(latest)}`;
  const insightTexts = comparisonInsightTexts(comparisonCategoryRows, comparisonKeywordRows);
  const categoryHeaders = [
    "제품군",
    ...comparisonReports.map((report) => periodLabel(report)),
    "최고순위 변동",
    "Top 100 증감",
    "Top 500 증감"
  ];
  const categoryRows = comparisonCategoryRows.map((row) => [
    row.category,
    ...row.points.map((point) => point.bestRank
      ? `최고 ${point.bestRank}위 / Top 100 ${point.top100Count}개 / Top 500 ${point.top500Count}개`
      : "진입 없음"),
    formatCategoryRankChange(row),
    `${formatCountDelta(row.top100Delta)}개`,
    `${formatCountDelta(row.top500Delta)}개`
  ]);
  const latestRows = comparisonLatestChanges.map((row) => [
    row.keyword,
    row.category,
    row.previousRank || "-",
    row.latestRank || "-",
    row.rankDelta == null ? "-" : formatRankDelta(row.rankDelta),
    comparisonChangeLabel(row.changeType, true)
  ]);
  const keywordRows = comparableRows.map((row) => [
    row.keyword,
    row.category,
    row.previous ? Number(row.previous.rank) : "-",
    row.latest ? Number(row.latest.rank) : "-",
    row.rankDelta == null ? "-" : formatRankDelta(row.rankDelta),
    comparisonChangeLabel(row.changeType)
  ]);
  const summaryItems = [
    [`${COMPARISON_MODES[comparisonMode].label} 비교 기간`, `${comparisonReports.length}개`],
    ["직전·최신 공통 검색어", `${counts.common}개`],
    ["신규 / 이탈", `${counts.new} / ${counts.exited}`],
    ["순위 상승 / 하락", `${counts.rising} / ${counts.falling}`]
  ];
  const summaryHtml = summaryItems.map(([label, value]) => `
    <td style="width:25%;padding:12px;border:1px solid #d7dee8;background:#f8fafc;vertical-align:top;">
      <div style="font-size:12px;color:#667482;">${escapeHtml(label)}</div>
      <div style="margin-top:6px;font-size:20px;font-weight:700;color:#17202a;">${escapeHtml(value)}</div>
    </td>
  `).join("");
  const latestSummaryHtml = [
    [`${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급상승`, latestCounts.rising],
    [`${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급락`, latestCounts.falling],
    ["신규 Top 500", latestCounts.new],
    ["Top 500 이탈", latestCounts.exited]
  ].map(([label, value]) => `
    <td style="width:25%;padding:9px 10px;border:1px solid #d7dee8;">
      <div style="font-size:11px;color:#667482;">${escapeHtml(label)}</div>
      <strong style="display:block;margin-top:4px;color:#17202a;">${value}개</strong>
    </td>
  `).join("");

  const html = `
    <div style="max-width:1100px;font-family:Arial,'Noto Sans KR',sans-serif;color:#17202a;line-height:1.45;">
      <div style="border-top:5px solid #168246;padding-top:18px;">
        <div style="font-size:12px;font-weight:700;color:#168246;">NAVER SHOPPING INSIGHT</div>
        <h1 style="margin:5px 0 4px;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
        <div style="font-size:13px;color:#667482;">${escapeHtml(range)}</div>
      </div>
      <div style="margin:14px 0;padding:11px 13px;border-left:3px solid #168246;background:#eef7f1;font-size:12px;">
        <strong>산정 기준</strong><br>${escapeHtml(comparisonMethodText(comparisonMode))}
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:14px 0 24px;"><tr>${summaryHtml}</tr></table>
      <h2 style="margin:0 0 10px;font-size:18px;">변화 요약</h2>
      ${insightTexts.map((text) => `<div style="margin:0 0 7px;padding:10px 12px;border-left:3px solid #168246;background:#f8fafc;font-size:13px;">${escapeHtml(text)}</div>`).join("")}
      <h2 style="margin:24px 0 5px;font-size:18px;">최신 기간 주요 순위 변화</h2>
      <div style="margin-bottom:10px;font-size:12px;color:#667482;">${escapeHtml(latestRange)}</div>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:12px;"><tr>${latestSummaryHtml}</tr></table>
      ${emailTableHtml(["검색어", "제품군", "이전 순위", "최신 순위", "순위 변동", "상태"], latestRows, "조건에 해당하는 최신 순위 변화가 없습니다.")}
      <h2 style="margin:26px 0 10px;font-size:18px;">제품군 순위 비교</h2>
      ${emailTableHtml(categoryHeaders, categoryRows)}
      <h2 style="margin:26px 0 5px;font-size:18px;">키워드 비교</h2>
      <div style="margin-bottom:10px;font-size:12px;color:#667482;">${escapeHtml(latestRange)} · 최신 2개 기간만 비교</div>
      ${emailTableHtml(["검색어", "제품군", `${periodLabel(previous)} 순위`, `${periodLabel(latest)} 순위`, "순위 변동", "상태"], keywordRows)}
    </div>
  `;
  const text = [
    title,
    range,
    `산정 기준: ${comparisonMethodText(comparisonMode)}`,
    "",
    ...summaryItems.map(([label, value]) => `${label}: ${value}`),
    "",
    "변화 요약",
    ...insightTexts,
    "",
    `최신 기간 주요 순위 변화 (${latestRange})`,
    tabSeparatedText(["검색어", "제품군", "이전 순위", "최신 순위", "순위 변동", "상태"], latestRows),
    "",
    "제품군 순위 비교",
    tabSeparatedText(categoryHeaders, categoryRows),
    "",
    `키워드 비교 (${latestRange})`,
    tabSeparatedText(["검색어", "제품군", "이전 순위", "최신 순위", "순위 변동", "상태"], keywordRows)
  ].join("\n");

  return { html, text };
}

function comparisonInsightTexts(categoryRows, keywordRows) {
  const rankWinner = keywordRows.filter((row) => row.rankDelta > 0).sort((a, b) => b.rankDelta - a.rankDelta)[0];
  const bestNew = keywordRows
    .filter((row) => row.changeType === "new")
    .sort((a, b) => Number(a.latest?.rank || 9999) - Number(b.latest?.rank || 9999))[0];
  const broadeningCategory = categoryRows
    .filter((row) => row.top100Delta > 0 || row.top500Delta > 0)
    .sort((a, b) => b.top100Delta - a.top100Delta || b.top500Delta - a.top500Delta)[0];

  return [
    rankWinner
      ? `최대 순위 상승: ${rankWinner.keyword}이 ${rankWinner.rankDelta}위 상승했습니다.`
      : "최대 순위 상승: 직전·최신 기간에 공통으로 등장하며 순위가 오른 검색어가 없습니다.",
    bestNew
      ? `신규 진입 최고 순위: ${bestNew.keyword}이 ${bestNew.latest.rank}위로 진입했습니다.`
      : "신규 진입: 최신 기간에 새로 Top 500에 진입한 검색어가 없습니다.",
    broadeningCategory
      ? `상위권 확장 제품군: ${broadeningCategory.category}의 Top 100 키워드가 ${formatCountDelta(broadeningCategory.top100Delta)}개, Top 500 키워드가 ${formatCountDelta(broadeningCategory.top500Delta)}개 변했습니다.`
      : "제품군 분포: 첫·마지막 기간 사이 Top 100 또는 Top 500 키워드 수가 늘어난 제품군이 없습니다."
  ];
}

function comparisonChangeLabel(type, latestSection = false) {
  const labels = latestSection
    ? { new: "신규 Top 500", rising: `${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급상승`, falling: `${LATEST_RANK_CHANGE_THRESHOLD}위 이상 급락`, exited: "Top 500 이탈", unchanged: "변동 없음" }
    : { new: "신규 진입", rising: "순위 상승", falling: "순위 하락", exited: "Top 500 이탈", unchanged: "변동 없음" };
  return labels[type] || labels.unchanged;
}

function emailTableHtml(headers, rows, emptyMessage = "표시할 자료가 없습니다.") {
  const headerHtml = headers.map((header) => `<th style="padding:8px 9px;border:1px solid #d7dee8;background:#f1f4f7;color:#44515e;text-align:left;font-size:11px;">${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows.length
    ? rows.map((row) => `<tr>${row.map((cell) => `<td style="padding:7px 9px;border:1px solid #d7dee8;font-size:12px;vertical-align:top;">${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}" style="padding:10px;border:1px solid #d7dee8;color:#667482;font-size:12px;">${escapeHtml(emptyMessage)}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;border-spacing:0;"> <thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

function tabSeparatedText(headers, rows) {
  return [headers, ...rows].map((row) => row.map((cell) => String(cell ?? "").replace(/[\t\r\n]+/g, " ")).join("\t")).join("\n");
}

async function writeRichClipboard(html, plainText) {
  if (navigator.clipboard?.write && window.ClipboardItem) {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText], { type: "text/plain" })
    });
    await navigator.clipboard.write([item]);
    return;
  }

  const container = document.createElement("div");
  container.contentEditable = "true";
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.innerHTML = html;
  document.body.append(container);

  const selection = window.getSelection();
  let copied = false;
  try {
    const range = document.createRange();
    range.selectNodeContents(container);
    selection.removeAllRanges();
    selection.addRange(range);
    copied = document.execCommand("copy");
  } finally {
    selection.removeAllRanges();
    container.remove();
  }
  if (!copied) throw new Error("브라우저가 서식 복사를 허용하지 않았습니다.");
}

function periodAxisLabelParts(value) {
  const text = String(value || "");
  const range = text.match(/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/);
  if (range) return [shortPeriodDate(range[1]), `~ ${shortPeriodDate(range[2])}`];

  const keyRange = text.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
  if (keyRange) return [shortPeriodDate(keyRange[1]), `~ ${shortPeriodDate(keyRange[2])}`];

  return [shortPeriodDate(text), ""];
}

function shortPeriodDate(value) {
  const text = String(value || "");
  const date = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (date) return `${date[1].slice(2)}-${date[2]}-${date[3]}`;

  const month = text.match(/^(\d{4})-(\d{2})$/);
  if (month) return `${month[1].slice(2)}-${month[2]}`;

  return text.length > 12 ? text.slice(0, 12) : text;
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
    const range = `${reportOrKey.startDate || ""} ~ ${reportOrKey.endDate || ""}`.trim();
    return reportOrKey.comparisonLabel ? `${reportOrKey.comparisonLabel} (${range})` : range;
  }

  const key = String(reportOrKey || "");
  const range = key.match(/^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/);
  if (range) return `${range[1]} ~ ${range[2]}`;

  const month = key.match(/^(\d{4})-(\d{2})$/);
  if (month) return `${key}-01 ~ ${lastDayOfMonth(key)}`;

  return key;
}

function lastDayOfMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return formatDate(new Date(year, month, 0));
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

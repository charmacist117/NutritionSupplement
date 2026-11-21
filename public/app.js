import { COMPARISON_MODES, buildComparisonOptions, buildComparisonPeriods, buildKeywordRankChanges, comparisonMethodText, completeMonthKey } from "./comparisonPeriods.js";
import { baseAutoProductCategoryFor, baseAutoProductCategoriesFor, mappingReview, compareMappingPriority, isMappingReviewTarget } from "./categoryMappingReview.js";
import { MAX_CATEGORY_ASSIGNMENTS, normalizeAssignedCategories, categoryMappingRecord } from "./categoryAssignments.js";

const statusText = document.querySelector("#status");
const adminStatus = document.querySelector("#admin-status");
const adminLoginForm = document.querySelector("#admin-login-form");
const adminPassword = document.querySelector("#admin-password");
const adminLoginButton = document.querySelector("#admin-login");
const adminLogoutButton = document.querySelector("#admin-logout");
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
const categoryOrderList = document.querySelector("#category-order-list");
const categoryOrderStatus = document.querySelector("#category-order-status");
const categoryOrderButtons = [...document.querySelectorAll("[data-category-move]")];
const categoryStatusRefreshButton = document.querySelector("#category-status-refresh");
const categoryStatusDownloadButton = document.querySelector("#category-status-download");
const categoryStatusModeButtons = [...document.querySelectorAll("[data-category-status-mode]")];
const categoryStatusPeriodHelp = document.querySelector("#category-status-period-help");
const categoryStatusPeriodList = document.querySelector("#category-status-period-list");
const categoryStatusPeriodMessage = document.querySelector("#category-status-period-message");
const categoryStatusCustomForm = document.querySelector("#category-status-custom-form");
const categoryStatusStart = document.querySelector("#category-status-start");
const categoryStatusEnd = document.querySelector("#category-status-end");
const categoryStatusSummary = document.querySelector("#category-status-summary");
const statusSeriesType = document.querySelector("#status-series-type");
const statusSeriesSearch = document.querySelector("#status-series-search");
const statusSeriesOptions = document.querySelector("#status-series-options");
const statusSeriesAddButton = document.querySelector("#status-series-add");
const statusSeriesList = document.querySelector("#status-series-list");
const categoryRankChart = document.querySelector("#category-rank-chart");
const categoryRankTooltip = document.querySelector("#category-rank-tooltip");
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
const comparisonPdfDownloadButton = document.querySelector("#comparison-pdf-download");
const comparisonDownloadButton = document.querySelector("#comparison-download");
const executivePdfDownloadButton = document.querySelector("#executive-pdf-download");
const executiveBaselinePeriods = document.querySelector("#executive-baseline-periods");
const executiveCurrentPeriods = document.querySelector("#executive-current-periods");
const executiveReportStatus = document.querySelector("#executive-report-status");
const comparisonModeButtons = [...document.querySelectorAll("[data-comparison-mode]")];
const comparisonPeriodList = document.querySelector("#comparison-period-list");
const comparisonPeriodLegend = document.querySelector("#comparison-period-legend");
const comparisonPeriodHelp = document.querySelector("#comparison-period-help");
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
const ingredientsSearchForm = document.querySelector("#ingredients-search-form");
const ingredientsSearch = document.querySelector("#ingredients-search");
const ingredientsSyncButton = document.querySelector("#ingredients-sync");
const ingredientsStatus = document.querySelector("#ingredients-status");
const ingredientsBody = document.querySelector("#ingredients-body");
const ingredientsPrevButton = document.querySelector("#ingredients-prev");
const ingredientsNextButton = document.querySelector("#ingredients-next");
const ingredientsPage = document.querySelector("#ingredients-page");
const productsSearchForm = document.querySelector("#products-search-form");
const productsFoodCategory = document.querySelector("#products-food-category");
const productsQuery = document.querySelector("#products-query");
const productsCompany = document.querySelector("#products-company");
const productsSearchTarget = document.querySelector("#products-search-target");
const productsIncludeExport = document.querySelector("#products-include-export");
const productsStatus = document.querySelector("#products-status");
const productsBody = document.querySelector("#products-body");
const productsPrevButton = document.querySelector("#products-prev");
const productsNextButton = document.querySelector("#products-next");
const productsPage = document.querySelector("#products-page");
const productsDownloadButton = document.querySelector("#products-download");
const productsDownloadStatus = document.querySelector("#products-download-status");
const productDetailDialog = document.querySelector("#product-detail-dialog");
const productDetailTitle = document.querySelector("#product-detail-title");
const productDetailMeta = document.querySelector("#product-detail-meta");
const productDetailTables = document.querySelector("#product-detail-tables");
const productDetailClose = document.querySelector("#product-detail-close");
const apiSettingsRefreshButton = document.querySelector("#api-settings-refresh");
const apiSettingsSummary = document.querySelector("#api-settings-summary");
const apiActiveProfile = document.querySelector("#api-active-profile");
const apiProfileSaveButton = document.querySelector("#api-profile-save");
const apiSettingsStatus = document.querySelector("#api-settings-status");
const apiProfileBody = document.querySelector("#api-profile-body");
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


let selectedMonth = null;
let currentReport = null;
let reportKeys = [];
let reportCache = new Map();
let categoryMappings = new Map();
let categoryMappingsLoaded = false;
let categorySaveInFlight = false;
let mappingDirty = false;
let mappingRevision = null;
let adminAuthenticated = false;
let productCategories = [...DEFAULT_PRODUCT_CATEGORIES];
let categoryAliases = new Map();
let mappingRows = [];
let newKeywordRows = [];
let categoryStatusReports = [];
let categoryStatusRows = [];
let categoryStatusMode = "month";
let categoryStatusRenderVersion = 0;
let categoryStatusCustomKey = "";
const categoryStatusSelections = new Map();
let categoryRankTooltipMark = null;
let selectedStatusCategory = "";
let selectedTrendSeries = readTrendSeriesSelection();
let draggedReportKey = null;
let comparisonSelectionLoaded = false;
let comparisonSelectedKeys = new Set();
let comparisonReports = [];
let comparisonRenderVersion = 0;
let comparisonCategoryRows = [];
let comparisonKeywordRows = [];
let comparisonLatestChanges = [];
let comparisonMode = readComparisonMode();
let executivePeriodSelectionLoaded = false;
let executiveBaselineKeys = new Set();
let executiveCurrentKeys = new Set();
let ingredientsLoaded = false;
let ingredientsCurrentPage = 1;
let productsCurrentPage = 1;
let productsRequest = null;
let productsDownloadRequest = null;
let productsSearchParams = null;
let productDetailRequest = null;
let productRows = new Map();
let healthState = {
  naverConfigured: false,
  blobConfigured: false
};

setPreviousMonthDates();
updateProductFoodCategory();
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
  if (mappingDirty && !window.confirm("저장하지 않은 분류 편집을 버리고 최신 자료를 불러올까요?")) return;
  if (await loadCategoryMappings()) await renderMappingSheet({ refreshReports: true });
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
categoryOrderList.addEventListener("change", updateCategoryOrderButtons);
for (const button of categoryOrderButtons) {
  button.addEventListener("click", () => {
    moveProductCategory(button.dataset.categoryMove);
    if (button.disabled) categoryOrderList.focus();
  });
}

categoryStatusRefreshButton.addEventListener("click", async () => {
  await renderCategoryStatusSheet({ refreshReports: true });
});
categoryStatusDownloadButton.addEventListener("click", downloadCategoryStatusXlsx);
for (const button of categoryStatusModeButtons) {
  button.addEventListener("click", () => {
    categoryStatusMode = button.dataset.categoryStatusMode;
    renderCategoryStatusSheet();
  });
}
categoryStatusPeriodList.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-report-key]");
  if (!input) return;
  const selected = categoryStatusSelections.get(categoryStatusMode);
  const key = input.dataset.reportKey;
  if (input.checked) selected.add(key);
  else selected.delete(key);
  renderCategoryStatusSheet({ keepPeriodList: true });
});
categoryStatusCustomForm.addEventListener("input", () => {
  categoryStatusEnd.setCustomValidity("");
  categoryStatusEnd.min = categoryStatusStart.value;
});
categoryStatusCustomForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (categoryStatusStart.value > categoryStatusEnd.value) {
    categoryStatusEnd.setCustomValidity("종료일은 시작일 이후로 선택해주세요.");
    categoryStatusEnd.reportValidity();
    return;
  }
  categoryStatusCustomKey = `${categoryStatusStart.value}_${categoryStatusEnd.value}`;
  renderCategoryStatusSheet();
});
categoryRankChart.addEventListener("pointerover", showCategoryRankTooltip);
categoryRankChart.addEventListener("focusin", showCategoryRankTooltip);
categoryRankChart.addEventListener("click", showCategoryRankTooltip);
categoryRankChart.addEventListener("pointerout", hideCategoryRankTooltip);
categoryRankChart.addEventListener("focusout", hideCategoryRankTooltip);
categoryRankChart.parentElement.addEventListener("scroll", () => {
  if (categoryRankTooltipMark) positionCategoryRankTooltip(categoryRankTooltipMark);
});
categoryRankChart.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideCategoryRankTooltip();
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
  comparisonSelectedKeys = new Set(buildComparisonOptions(reportKeys, comparisonMode).map((option) => option.key));
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
comparisonPdfDownloadButton.addEventListener("click", () => downloadComparisonPdf());
apiSettingsRefreshButton.addEventListener("click", () => loadApiSettings());
apiActiveProfile.addEventListener("change", () => {
  apiProfileSaveButton.disabled = !apiActiveProfile.value;
});
apiProfileSaveButton.addEventListener("click", () => saveActiveApiProfile());
ingredientsSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadIngredients(1);
});
ingredientsSyncButton.addEventListener("click", async () => {
  ingredientsSyncButton.disabled = true;
  ingredientsStatus.textContent = "식품안전나라 전체 원료 자료를 동기화하고 저장하는 중입니다.";
  try {
    const response = await adminRequest("/api/individual-ingredients", { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "원료 자료를 저장하지 못했습니다.");
    ingredientsLoaded = true;
    ingredientsSearch.value = "";
    await loadIngredients(1);
  } catch (error) {
    ingredientsStatus.textContent = error.message;
  } finally {
    ingredientsSyncButton.disabled = false;
  }
});
ingredientsPrevButton.addEventListener("click", () => loadIngredients(ingredientsCurrentPage - 1));
ingredientsNextButton.addEventListener("click", () => loadIngredients(ingredientsCurrentPage + 1));
productsSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadProducts(1);
});
productsPrevButton.addEventListener("click", () => loadProducts(productsCurrentPage - 1));
productsNextButton.addEventListener("click", () => loadProducts(productsCurrentPage + 1));
productsDownloadButton.addEventListener("click", downloadProductsXlsx);
productsFoodCategory.addEventListener("change", () => {
  updateProductFoodCategory();
  productRows.clear();
  productsBody.innerHTML = '<tr><td colspan="8">검색 조건을 입력하고 검색하세요.</td></tr>';
  productsStatus.textContent = productsFoodCategory.value === "general" ? "일반식품은 검색어 또는 업체명을 입력하세요." : "검색 조건을 입력하세요. 비워 두고 검색하면 전체 목록을 조회합니다.";
  productsPage.textContent = "1 / 1";
});
productsSearchForm.addEventListener("input", () => {
  productsRequest?.abort();
  productsDownloadRequest?.abort();
  productsSearchParams = null;
  productsDownloadButton.disabled = true;
  productsPrevButton.disabled = true;
  productsNextButton.disabled = true;
  productsDownloadStatus.textContent = "검색 조건이 변경되었습니다. 검색 후 전체 결과를 다운로드하세요.";
});
productsBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-product-id]");
  if (button) showProductDetail(productRows.get(button.dataset.productId));
});
productDetailClose.addEventListener("click", () => productDetailDialog.close());
productDetailDialog.addEventListener("close", () => productDetailRequest?.abort());

for (const button of comparisonModeButtons) {
  button.addEventListener("click", async () => {
    const nextMode = button.dataset.comparisonMode;
    if (!COMPARISON_MODES[nextMode] || nextMode === comparisonMode) return;

    comparisonMode = nextMode;
    comparisonSelectionLoaded = false;
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
    const response = await adminRequest("/api/collect-monthly", {
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

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminLoginButton.disabled = true;
  try {
    const response = await fetch("/api/admin-session", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "로그인에 실패했습니다.");
    adminPassword.value = "";
    showAdminSession(data);
  } catch (error) { adminStatus.textContent = error.message; }
  finally { adminLoginButton.disabled = false; }
});
adminLogoutButton.addEventListener("click", async () => {
  const response = await fetch("/api/admin-session", { method: "DELETE" });
  if (response.ok) showAdminSession(await response.json());
});

await loadAdminSession();
await loadHealth();
await loadCategoryMappings();
await loadMonths();

async function loadAdminSession() {
  try {
    const response = await fetch("/api/admin-session", { cache: "no-store" });
    if (!response.ok) throw new Error("로그인 상태를 확인하지 못했습니다. 새로고침해주세요.");
    showAdminSession(await response.json());
  } catch (error) { adminStatus.textContent = error.message; }
}

function showAdminSession(session) {
  adminAuthenticated = session.authenticated;
  adminStatus.textContent = adminAuthenticated ? "관리자로 로그인했습니다. 로그인은 8시간 유지됩니다."
    : session.configured ? "저장·삭제·수집과 보고서 생성은 관리자 로그인 후 이용할 수 있습니다."
    : session.configurationIssue === "password_too_short"
    ? "ADMIN_PASSWORD가 16자 미만입니다. Vercel의 Production 환경에서 16자 이상으로 변경해주세요."
    : "ADMIN_PASSWORD가 설정되지 않았습니다. Vercel의 Production 환경에 16자 이상으로 등록해주세요.";
  adminLoginForm.hidden = adminAuthenticated;
  adminLogoutButton.hidden = !adminAuthenticated;
  updateMappingEditorState();
}

async function adminRequest(url, options) {
  if (!adminAuthenticated) {
    adminPassword.focus();
    throw new Error("상단에서 관리자 로그인 후 다시 시도해주세요.");
  }
  const response = await fetch(url, options);
  if (response.status === 401) showAdminSession({ configured: true, authenticated: false });
  return response;
}

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

    const profileText = health.naverActiveProfileLabel ? `${health.naverActiveProfileLabel} · ` : "";
    statusText.textContent = `수집 준비가 완료되었습니다. ${profileText}API 키 ${health.naverActiveCredentialCount || health.naverCredentialCount || 1}개를 사용합니다.`;
  } catch {
    statusText.textContent = "설정 상태를 확인하지 못했습니다.";
  }
}

async function loadApiSettings() {
  apiSettingsStatus.textContent = "등록된 네이버 API 프로필을 확인하는 중입니다.";
  apiProfileSaveButton.disabled = true;

  try {
    const response = await fetch("/api/naver-api-settings");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "API 설정을 불러오지 못했습니다.");

    const profiles = data.profiles || [];
    apiActiveProfile.replaceChildren();
    for (const profile of profiles) {
      const option = document.createElement("option");
      option.value = profile.profile;
      option.textContent = `${profile.label} (${profile.credentialCount}개)`;
      option.selected = profile.profile === data.activeProfile;
      apiActiveProfile.append(option);
    }

    apiSettingsSummary.innerHTML = `
      <div><span>활성 프로필</span><strong>${escapeHtml(profiles.find((item) => item.profile === data.activeProfile)?.label || "미등록")}</strong></div>
      <div><span>등록 프로필</span><strong>${profiles.length}개</strong></div>
      <div><span>등록 API 키</span><strong>${profiles.reduce((sum, item) => sum + item.credentialCount, 0)}개</strong></div>
      <div><span>비밀키 저장</span><strong>Vercel 환경변수</strong></div>`;

    apiProfileBody.replaceChildren();
    for (const profile of profiles) {
      for (const [index, credential] of profile.credentials.entries()) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index === 0 ? escapeHtml(profile.label) : ""}</td>
          <td>${escapeHtml(credential.name)}</td>
          <td>${credential.provider === "api-hub" ? "NAVER API HUB" : "개발자센터"}</td>
          <td><code>${escapeHtml(credential.clientIdHint)}</code></td>
          <td>${profile.profile === data.activeProfile ? '<span class="status-badge active">사용 중</span>' : '<span class="status-badge">대기</span>'}</td>`;
        apiProfileBody.append(row);
      }
    }
    if (!profiles.length) apiProfileBody.innerHTML = '<tr><td colspan="5">Vercel에 등록된 네이버 API 키가 없습니다.</td></tr>';
    apiActiveProfile.disabled = !profiles.length;
    apiProfileSaveButton.disabled = !profiles.length;
    apiSettingsStatus.textContent = profiles.length
      ? "활성 프로필을 변경하면 다음 데이터 수집부터 해당 프로필의 키만 사용합니다."
      : "먼저 Vercel 환경변수에 네이버 API 키를 등록해주세요.";
  } catch (error) {
    apiSettingsStatus.textContent = error.message;
  }
}

async function saveActiveApiProfile() {
  apiProfileSaveButton.disabled = true;
  apiSettingsStatus.textContent = "활성 프로필을 저장하는 중입니다.";
  try {
    const response = await adminRequest("/api/naver-api-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeProfile: apiActiveProfile.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "활성 프로필을 저장하지 못했습니다.");
    await loadHealth();
    await loadApiSettings();
    apiSettingsStatus.textContent = "활성 프로필을 저장했습니다. 다음 수집부터 적용됩니다.";
  } catch (error) {
    apiSettingsStatus.textContent = error.message;
    apiProfileSaveButton.disabled = false;
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
  if (tab === "ingredients" && !ingredientsLoaded) await loadIngredients(1);
  if (tab === "settings") await loadApiSettings();
}

async function loadIngredients(page) {
  ingredientsStatus.textContent = "저장된 원료 자료를 불러오는 중입니다.";
  ingredientsPrevButton.disabled = true;
  ingredientsNextButton.disabled = true;
  try {
    const params = new URLSearchParams({ page: String(Math.max(1, page)), q: ingredientsSearch.value.trim() });
    const response = await fetch(`/api/individual-ingredients?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "건강기능식품 원료를 불러오지 못했습니다.");
    ingredientsLoaded = true;
    ingredientsCurrentPage = data.page;
    ingredientsBody.innerHTML = data.items.length ? data.items.map((item) => `
      <tr>
        <td>${escapeHtml(item.number)}</td><td>${escapeHtml(item.registeredDate)}</td><td>${escapeHtml(item.validity)}</td>
        <td><strong>${escapeHtml(item.ingredient)}</strong></td><td>${escapeHtml(item.recognitionNumber)}</td><td>${escapeHtml(item.company)}</td>
        <td>${escapeHtml(item.functionality)}</td><td>${escapeHtml(item.dailyIntake)}</td><td>${escapeHtml(item.cautions)}</td><td>${escapeHtml(item.other)}</td>
      </tr>`).join("") : '<tr><td colspan="10">검색 결과가 없습니다.</td></tr>';
    const syncedAt = data.syncedAt ? ` · 동기화 ${new Date(data.syncedAt).toLocaleDateString("ko-KR")}` : "";
    ingredientsStatus.textContent = `총 ${data.total.toLocaleString("ko-KR")}건 · ${data.source}${syncedAt}`;
    ingredientsPage.textContent = `${data.page} / ${data.totalPages}`;
    ingredientsPrevButton.disabled = data.page <= 1;
    ingredientsNextButton.disabled = data.page >= data.totalPages;
  } catch (error) {
    ingredientsLoaded = true;
    ingredientsBody.innerHTML = `<tr><td colspan="10">${escapeHtml(error.message)}</td></tr>`;
    ingredientsStatus.textContent = error.message;
    ingredientsPage.textContent = "1 / 1";
  }
}

function updateProductFoodCategory() {
  const general = productsFoodCategory.value === "general";
  productsSearchForm.closest(".products-panel").classList.toggle("products-general", general);
  document.querySelector("#products-title").textContent = general ? "일반식품 검색 · 국내 가공식품" : "건강기능식품 검색";
  document.querySelector("#products-description").textContent = general
    ? "공식 가공식품 목록에서 제품명과 품목유형을 검색합니다. 원재료는 제품 상세에서 확인하세요."
    : "제품명은 실시간 조회하고, 품목 총 유형은 공식 신고자료의 전체 기능지표성분으로 검색합니다. 제품 상세는 실시간으로 확인합니다.";
  productsSearchTarget.querySelector('[value="types"]').textContent = general ? "품목유형" : "품목 총 유형";
  productsSearchTarget.querySelector('[value="all"]').textContent = general ? "제품명 + 품목유형" : "제품명 + 품목 총 유형";
  productsQuery.placeholder = general ? "홍삼젤리 또는 캔디류" : "오메가3 AND 비타민D";
  document.querySelector("#products-query-help").textContent = general
    ? "AND·OR·NOT과 괄호·따옴표를 사용할 수 있습니다. 제품명·품목유형·업체명의 포함 조건을 입력하세요. 넓은 조회는 20,000건까지이며, 후보 목록은 2분간 유지됩니다. 일반식품의 원재료는 상세에서 확인할 수 있습니다."
    : 'AND는 모두 포함, OR는 하나 이상 포함, NOT은 제외하며 괄호와 따옴표를 사용할 수 있습니다. 예: 마그네슘 AND "비타민 D" · 업체명은 검색식과 함께 적용됩니다. 품목 총 유형은 각 제품 상세표의 유형 전체를 검색합니다. 전체 성분·원료는 상세 버튼으로 확인하세요.';
}

async function loadProducts(page = 1) {
  productsRequest?.abort();
  productsDownloadRequest?.abort();
  productsSearchParams = null;
  productsDownloadButton.disabled = true;
  productsDownloadStatus.textContent = "";
  const controller = new AbortController();
  productsRequest = controller;
  productsStatus.textContent = productsFoodCategory.value === "general" || productsSearchTarget.value === "name" ? "식품안전나라에서 제품 목록을 조회하는 중입니다." : "전체 상세 유형 자료에서 검색하는 중입니다.";
  productsPage.textContent = "조회 중";
  productsBody.innerHTML = '<tr><td colspan="8">제품 목록을 불러오는 중입니다.</td></tr>';
  productRows.clear();
  productsPrevButton.disabled = true;
  productsNextButton.disabled = true;
  const params = new URLSearchParams({ page: String(Math.max(1, page)), q: productsQuery.value.trim(), company: productsCompany.value.trim(), target: productsSearchTarget.value, includeExport: String(productsIncludeExport.checked), foodCategory: productsFoodCategory.value });
  try {
    const response = await fetch(`/api/health-products?${params}`, { cache: "no-store", signal: controller.signal });
    const data = await response.json().catch(() => ({ error: "조회 응답을 받지 못했습니다. 잠시 후 다시 검색해주세요." }));
    if (!response.ok || !Array.isArray(data.items)) throw new Error(data.error || "제품 자료를 불러오지 못했습니다.");
    if (productsRequest !== controller) return;
    productsCurrentPage = data.page;
    productRows = new Map(data.items.map((item) => [item.id, item]));
    if (data.total > 0) {
      productsSearchParams = params.toString();
      productsDownloadButton.disabled = false;
    }
    productsBody.innerHTML = data.items.length ? data.items.map((item) => `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong>${item.productionEnded ? " <small>생산종료</small>" : ""}</td><td>${escapeHtml(item.company)}</td>
        <td>${escapeHtml(item.reportNumber)}</td><td>${escapeHtml(item.type)}</td><td class="product-ingredients" data-product-types="${escapeHtml(item.id)}">${typeof item.allTypes === "string" ? escapeHtml(item.allTypes || "원문 미기재") : "조회 중..."}</td><td>${escapeHtml(item.shelfLife)}</td><td>${escapeHtml(item.domesticExport)}</td>
        <td><button class="secondary-button compact-button" type="button" data-product-id="${escapeHtml(item.id)}">상세</button></td>
      </tr>`).join("") : '<tr><td colspan="8">검색 결과가 없습니다.</td></tr>';
    productsStatus.textContent = `검색 결과 ${data.total.toLocaleString("ko-KR")}건 · ${data.searchBasis} 기준 · ${data.catalogBuiltAt ? "검색 자료 갱신" : "조회"} ${new Date(data.fetchedAt).toLocaleString("ko-KR")}`;
    productsPage.textContent = `${data.page} / ${data.totalPages}`;
    productsPrevButton.disabled = data.page <= 1;
    productsNextButton.disabled = data.page >= data.totalPages;
    if (data.items.length && !data.catalogBuiltAt && !data.typesComplete) {
      // 목록 요청과 분리해 현재 페이지의 상세 유형을 서버리스 실행 시간 안에 조회한다.
      productsStatus.textContent += " · 품목 총 유형 조회 중";
      try {
        const typeParams = new URLSearchParams({ ids: data.items.map((item) => item.id).join(",") });
        const typeResponse = await fetch(`/api/health-products?${typeParams}`, { cache: "no-store", signal: controller.signal });
        const types = await typeResponse.json();
        if (!typeResponse.ok) throw new Error(types.error || "품목 총 유형을 불러오지 못했습니다.");
        if (productsRequest !== controller) return;
        const byId = new Map(types.items.map((item) => [item.id, item]));
        let failures = 0;
        for (const item of data.items) {
          const type = byId.get(item.id);
          const cell = productsBody.querySelector(`[data-product-types="${CSS.escape(item.id)}"]`);
          const error = !type ? "제품의 유형 응답이 없습니다." : type.typeError;
          cell.textContent = error ? (typeof item.allTypes === "string" ? `${item.allTypes || "원문 미기재"} (저장 자료)` : "조회 실패") : type.allTypes || "원문 미기재";
          cell.title = error ? `${error}${item.typesFetchedAt ? ` · 저장 자료 확인: ${new Date(item.typesFetchedAt).toLocaleString("ko-KR")}` : ""}` : "";
          if (error) failures++;
        }
        productsStatus.textContent = productsStatus.textContent.replace(" · 품목 총 유형 조회 중", failures ? ` · 품목 총 유형 ${failures}건 조회 실패 (상세 버튼으로 재확인)` : " · 품목 총 유형 확인 완료");
      } catch (error) {
        if (controller.signal.aborted || productsRequest !== controller) return;
        for (const cell of productsBody.querySelectorAll("[data-product-types]")) {
          const item = productRows.get(cell.dataset.productTypes);
          cell.textContent = typeof item?.allTypes === "string" ? `${item.allTypes || "원문 미기재"} (저장 자료)` : "조회 실패";
          cell.title = `${error.message}${item?.typesFetchedAt ? ` · 저장 자료 확인: ${new Date(item.typesFetchedAt).toLocaleString("ko-KR")}` : ""}`;
        }
        productsStatus.textContent = productsStatus.textContent.replace(" · 품목 총 유형 조회 중", " · 품목 총 유형 조회 실패 (상세 버튼으로 재확인)");
      }
    }
  } catch (error) {
    if (controller.signal.aborted || productsRequest !== controller) return;
    productsBody.innerHTML = `<tr><td colspan="8">${escapeHtml(error.message)}</td></tr>`;
    productsStatus.textContent = error.message;
    productsPage.textContent = "조회 불가";
  }
}

async function downloadProductsXlsx() {
  if (!productsSearchParams) return;
  const controller = new AbortController();
  productsDownloadRequest = controller;
  productsDownloadButton.disabled = true;
  productsDownloadStatus.textContent = "현재 검색 조건에 맞는 전체 결과의 엑셀 파일을 만드는 중입니다.";
  const params = new URLSearchParams(productsSearchParams);
  params.set("export", "all");
  params.delete("page");
  try {
    const response = await fetch(`/api/health-products?${params}`, { cache: "no-store", signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "검색 결과를 다운로드하지 못했습니다.");
    if (!Array.isArray(data.items) || data.items.length !== data.total) throw new Error("전체 검색 결과가 누락되어 다운로드를 중단했습니다.");
    if (productsDownloadRequest !== controller) return;
    const rows = [["식품 구분", "제품명", "업체명", "품목보고번호", "품목유형", "품목 총 유형", "소비기한", "내수/수출", "생산종료 여부", "전체 유형 확인일시"],
      ...data.items.map((item) => [item.foodCategory === "general" ? "일반식품" : "건강기능식품", item.name, item.company, item.reportNumber, item.type,
        item.foodCategory === "general" ? "해당 없음(일반식품)" : typeof item.allTypes === "string" ? item.allTypes || "원문 미기재" : "미확인",
        item.shelfLife, item.domesticExport,
        typeof item.productionEnded === "boolean" ? item.productionEnded ? "생산종료" : "아니오" : "원문 미제공",
        item.typesFetchedAt || ""])
    ];
    const blob = createXlsxBlob("건강기능식품 검색", rows);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const keywordFileName = (params.get("q") || "전체").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 60);
    link.download = `${params.get("foodCategory") === "general" ? "일반식품" : "건강기능식품"}_${keywordFileName}_${formatDate(new Date())}.xlsx`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    const unchecked = data.items.filter((item) => item.foodCategory !== "general" && typeof item.allTypes !== "string").length;
    productsDownloadStatus.textContent = `전체 ${data.total.toLocaleString("ko-KR")}건 엑셀 다운로드 완료${data.foodCategory === "general" ? " · 일반식품 품목유형 기준" : ` · 전체 유형은 ${data.catalogBuiltAt ? new Date(data.catalogBuiltAt).toLocaleString("ko-KR") : "저장 자료"} 기준`}${unchecked ? ` · 전체 유형 미확인 ${unchecked}건` : ""}`;
  } catch (error) {
    if (!controller.signal.aborted) productsDownloadStatus.textContent = error.message || "다운로드에 실패했습니다. 다시 시도해주세요.";
  } finally {
    if (productsDownloadRequest === controller) {
      productsDownloadRequest = null;
      productsDownloadButton.disabled = !productsSearchParams;
    }
  }
}

async function showProductDetail(item) {
  if (!item) return;
  productDetailRequest?.abort();
  const controller = new AbortController();
  productDetailRequest = controller;
  productDetailTitle.textContent = item.name;
  productDetailMeta.textContent = `${item.company} · ${item.reportNumber}`;
  productDetailTables.textContent = "식품안전나라에서 상세 원료를 조회하는 중입니다.";
  if (!productDetailDialog.open) productDetailDialog.showModal();
  try {
    const detailQuery = item.detailLookup === "report" ? `report=${encodeURIComponent(item.reportNumber)}` : `id=${encodeURIComponent(item.id)}`;
    const response = await fetch(`/api/health-products?${detailQuery}`, { cache: "no-store", signal: controller.signal });
    const detail = await response.json();
    if (!response.ok) throw new Error(detail.error || "상세정보를 불러오지 못했습니다.");
    if (productDetailRequest !== controller) return;
    const typeCell = productsBody.querySelector(`[data-product-types="${CSS.escape(item.id)}"]`);
    if (typeCell) {
      typeCell.textContent = detail.allTypes || "원문 미기재";
      typeCell.title = "";
    }
    productDetailTables.innerHTML = detail.tables.map((table, index) => `
      <section class="product-detail-table">
        <h3>상세 표 ${index + 1}</h3>
        <div class="table-wrap"><table><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      </section>`).join("");
    productDetailMeta.textContent += ` · 조회 ${new Date(detail.fetchedAt).toLocaleString("ko-KR")}`;
  } catch (error) {
    if (!controller.signal.aborted && productDetailRequest === controller) productDetailTables.textContent = error.message;
  }
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
    const response = await adminRequest("/api/monthly-report", {
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
    const response = await adminRequest(`/api/monthly-report?month=${encodeURIComponent(month)}`, {
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
      ...Array.from({ length: MAX_CATEGORY_ASSIGNMENTS }, (_, index) => `제품군 분류 ${index + 1}`),
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
        ...Array.from({ length: MAX_CATEGORY_ASSIGNMENTS }, (_, index) => categories[index] || ""),
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
    const response = await fetch("/api/keyword-category-mappings", { cache: "no-store" });
    if (!response.ok) throw new Error("저장된 카테고리를 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해주세요.");
    const data = await response.json();
    if (!Object.hasOwn(data, "revision")) throw new Error("카테고리 자료 버전을 확인하지 못했습니다. 페이지를 새로고침해주세요.");
    setCategoryMappings(data);
    return true;
  } catch (error) {
    categoryMappingsLoaded = false;
    mappingStatus.textContent = error.message;
    updateMappingEditorState();
    return false;
  }
}

function setCategoryMappings(data) {
  mappingRevision = data.revision;
  categoryMappingsLoaded = true;
  mappingDirty = false;
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
  if (!categoryMappingsLoaded) {
    mappingBody.innerHTML = '<tr><td colspan="7">카테고리 자료를 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해주세요.</td></tr>';
    updateMappingEditorState();
    return;
  }
  updateCategoryManagerOptions();
  if (!reportKeys.length) {
    mappingRows = [];
    newKeywordRows = [];
    renderMappingSummary();
    mappingStatus.textContent = "저장된 리포트가 없어 매칭할 키워드가 없습니다.";
    mappingBody.innerHTML = `<tr><td colspan="7">저장된 리포트가 없습니다.</td></tr>`;
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
    updateMappingEditorState();
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

  return [...byKeyword.values()];
}

function renderMappingSummary() {
  const firstCount = newKeywordRows.filter((row) => row.appearanceType === "first").length;
  const returningCount = newKeywordRows.filter((row) => row.appearanceType === "returning").length;
  const reviews = mappingRows.map((row) => ({ ...row, review: mappingReview(manualCategoriesFor(row.keyword), autoProductCategorySuggestionsFor(row.keyword)) }));
  const mappedCount = reviews.filter((row) => row.review.priority === 3).length;
  const neededCount = reviews.filter(isMappingReviewTarget).length;

  mappingSummary.innerHTML = [
    comparisonMetricHtml("전체 키워드", `${mappingRows.length}개`, "저장 자료 전체의 고유 검색어"),
    comparisonMetricHtml("우선 검토", `${neededCount}개`, "미확정 신규·재진입, 임시 분류, 복수 후보"),
    comparisonMetricHtml("신규·재진입", `${firstCount + returningCount}개`, `최초 등장 ${firstCount}개 · 재진입 ${returningCount}개`),
    comparisonMetricHtml("분류 완료 / 카테고리", `${mappedCount} / ${productCategories.length}`, "임시 분류를 제외한 직접 매칭과 제품군 수")
  ].join("");
}

function renderMappingRows() {
  const search = normalizeText(mappingSearch.value);
  const filter = mappingFilter.value;
  const prioritized = mappingRows.map((row) => {
    const manualCategories = manualCategoriesFor(row.keyword);
    const suggestions = autoProductCategorySuggestionsFor(row.keyword);
    return { ...row, manualCategories, suggestions, review: mappingReview(manualCategories, suggestions) };
  }).sort(compareMappingPriority);
  const rows = prioritized.filter((row) => {
    const mapped = row.review.priority === 3;
    if (filter === "review" && !isMappingReviewTarget(row)) return false;
    if (filter === "mapped" && !mapped) return false;
    if (filter === "unmapped" && mapped) return false;
    if (filter === "new" && !row.appearanceType) return false;
    if ((filter === "first" || filter === "returning") && row.appearanceType !== filter) return false;
    return !search
      || normalizeText(row.keyword).includes(search)
      || normalizeText([...row.manualCategories, ...row.suggestions].join(" ")).includes(search);
  });
  const mappedCount = prioritized.filter((row) => row.review.priority === 3).length;

  mappingStatus.textContent = `총 ${mappingRows.length}개 중 ${rows.length}개 표시 · 우선 검토 ${prioritized.filter(isMappingReviewTarget).length}개 · 분류 완료 ${mappedCount}개 · 미확정 신규·재진입 → 불분명·기타·브랜드 등 → 나머지 검토 대상 → 분류 완료 순`;
  mappingBody.replaceChildren();

  if (!rows.length) {
    mappingBody.innerHTML = `<tr><td colspan="7">${filter === "review" && !search ? "우선 검토 대상이 없습니다. ‘미확정 전체’에서 단일 자동 추천을 확인할 수 있습니다." : "조건에 맞는 키워드가 없습니다."}</td></tr>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");
    const keywordCell = document.createElement("td");
    const reviewCell = document.createElement("td");
    const appearanceCell = document.createElement("td");
    const monthCell = document.createElement("td");
    const rankCell = document.createElement("td");
    const suggestionCell = document.createElement("td");
    const categoryCell = document.createElement("td");
    const categoryInputs = createCategorySearchGroup(row.keyword);

    keywordCell.textContent = row.keyword;
    reviewCell.className = "mapping-review-cell";
    reviewCell.innerHTML = mappingReviewHtml(row.review, row.manualCategories.length > 0);
    appearanceCell.innerHTML = row.appearanceType ? newKeywordAppearanceBadge(row.appearanceType) : `<span class="muted-cell">-</span>`;
    monthCell.textContent = row.latestMonth || "-";
    rankCell.textContent = row.latestRank || "-";
    suggestionCell.innerHTML = `<span class="category-suggestion">${escapeHtml(row.suggestions.join(" · "))}</span>`;
    categoryCell.append(categoryInputs);

    tr.append(keywordCell, reviewCell, appearanceCell, monthCell, rankCell, suggestionCell, categoryCell);
    fragment.append(tr);
  }

  mappingBody.append(fragment);
  updateMappingEditorState();
}

function mappingReviewHtml(review, mapped) {
  return `<span class="assignment-badge ${review.needsReview ? "unmapped" : mapped ? "manual" : "automatic"}">${escapeHtml(review.label)}</span><small>${escapeHtml(review.reason)}</small>`;
}

function createCategorySearchGroup(keyword) {
  const group = document.createElement("div");
  group.className = "category-input-group";
  const inputs = [];
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "secondary-button compact-button category-add-slot";
  addButton.textContent = "+ 카테고리 추가";
  addButton.setAttribute("aria-label", `${keyword} 카테고리 입력 추가`);
  group.append(addButton);
  const addInput = () => {
    const slot = inputs.length;
    const input = document.createElement("input");
    input.type = "search";
    input.className = "category-search-input";
    input.setAttribute("list", "mapping-category-options");
    input.placeholder = `${slot + 1}차 카테고리 검색`;
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
    inputs.push(input);
    group.insertBefore(input, addButton);
    addButton.hidden = inputs.length >= MAX_CATEGORY_ASSIGNMENTS;
  };
  for (let i = 0; i < Math.max(2, manualCategoriesFor(keyword).length); i++) addInput();
  addButton.addEventListener("click", () => {
    if (inputs.length >= MAX_CATEGORY_ASSIGNMENTS) return;
    addInput();
    syncCategorySearchInputs(keyword, inputs);
    inputs.at(-1).focus();
  });
  syncCategorySearchInputs(keyword, inputs);
  return group;
}

function commitCategorySearch(keyword, slot, input, inputs) {
  if (categorySaveInFlight || !categoryMappingsLoaded || !adminAuthenticated) return;
  const query = String(input.value || "").trim();
  const category = query ? resolveCategorySearch(query) : "";
  if (query && !category) {
    input.setCustomValidity("카테고리 후보를 더 입력하거나 자동완성 목록에서 선택해주세요.");
    input.reportValidity();
    return;
  }

  const current = manualCategoriesFor(keyword);
  if (category && current.some((value, index) => index !== slot && value === category)) {
    input.setCustomValidity("같은 카테고리를 두 번 지정할 수 없습니다.");
    input.reportValidity();
    return;
  }

  input.setCustomValidity("");
  updateCategoryMapping(keyword, category, slot);
  syncCategorySearchInputs(keyword, inputs);
  const reviewCell = input.closest("tr")?.querySelector(".mapping-review-cell");
  const manual = manualCategoriesFor(keyword);
  if (reviewCell) reviewCell.innerHTML = mappingReviewHtml(mappingReview(manual, autoProductCategorySuggestionsFor(keyword)), manual.length > 0);
  renderMappingSummary();
  const mappedCount = mappingRows.filter((row) => mappingReview(manualCategoriesFor(row.keyword), autoProductCategorySuggestionsFor(row.keyword)).priority === 3).length;
  mappingStatus.textContent = `총 ${mappingRows.length}개 · 분류 완료 ${mappedCount}개 · 저장 필요`;
  updateMappingEditorState();
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
  mappingDirty = true;
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
  if (!categoryMappingsLoaded || categorySaveInFlight || !adminAuthenticated) return;
  categorySaveInFlight = true;
  updateMappingEditorState();
  mappingStatus.textContent = "카테고리 매칭을 저장하는 중입니다.";

  try {
    const saved = await persistCategoryMappings();
    renderMappingSummary();
    renderMappingRows();
    mappingStatus.textContent = `${saved.categories.length}개 카테고리와 ${saved.mappings.length}개 키워드 매칭을 저장했습니다.`;
    categoryOrderStatus.textContent = "";
  } catch (error) {
    mappingStatus.textContent = error.message;
  } finally {
    categorySaveInFlight = false;
    updateCategoryManagerOptions();
  }
}

async function persistCategoryMappings() {
  const mappings = [...categoryMappings.values()]
    .filter((item) => item.keyword && item.category)
    .sort((a, b) => a.keyword.localeCompare(b.keyword, "ko"));
  const response = await adminRequest("/api/keyword-category-mappings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categories: productCategories,
      revision: mappingRevision,
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
  const previous = categoryManageSelect.value;
  const current = preferredCategory || previous;
  const ordering = categoryOrderList.value;
  categoryManageSelect.replaceChildren();
  mappingCategoryOptions.replaceChildren();
  categoryOrderList.replaceChildren();

  for (const [index, category] of productCategories.entries()) {
    categoryManageSelect.append(new Option(category, category));
    mappingCategoryOptions.append(new Option("", category));
    categoryOrderList.append(new Option(`${index + 1}. ${category}`, category));
  }

  categoryManageSelect.value = productCategories.includes(current) ? current : productCategories[0] || "";
  if (preferredCategory || previous !== categoryManageSelect.value) categoryRenameInput.value = categoryManageSelect.value;
  categoryOrderList.value = productCategories.includes(ordering) ? ordering : productCategories[0] || "";
  updateMappingEditorState();
}

function updateMappingEditorState() {
  const blocked = !adminAuthenticated || !categoryMappingsLoaded || categorySaveInFlight;
  mappingSaveButton.disabled = blocked;
  mappingRefreshButton.disabled = categorySaveInFlight;
  for (const control of document.querySelectorAll(".category-manager input, .category-manager select, .category-manager button, #mapping-body input, #mapping-body button")) {
    control.disabled = blocked;
  }
  categoryRenameButton.disabled = blocked || !productCategories.length;
  categoryDeleteButton.disabled = blocked || productCategories.length <= 1;
  categoryOrderList.disabled = blocked || !productCategories.length;
  mappingApplySuggestionsButton.disabled = blocked || !newKeywordRows.some((row) => mappingReview(manualCategoriesFor(row.keyword), autoProductCategorySuggestionsFor(row.keyword)).priority === 2);
  updateCategoryOrderButtons();
}

function updateCategoryOrderButtons() {
  const index = categoryOrderList.selectedIndex;
  const last = categoryOrderList.options.length - 1;
  for (const button of categoryOrderButtons) {
    const goesUp = ["first", "up"].includes(button.dataset.categoryMove);
    button.disabled = mappingSaveButton.disabled || index < 0 || index === (goesUp ? 0 : last);
  }
}

function moveProductCategory(direction) {
  if (mappingSaveButton.disabled) return;
  const index = categoryOrderList.selectedIndex;
  const last = productCategories.length - 1;
  const destination = ({ first: 0, up: index - 1, down: index + 1, last })[direction];
  if (index < 0 || !Number.isInteger(destination) || destination < 0 || destination > last || destination === index) return;

  const [category] = productCategories.splice(index, 1);
  productCategories.splice(destination, 0, category);
  mappingDirty = true;
  updateCategoryManagerOptions();
  categoryOrderStatus.textContent = `${category}을(를) ${destination + 1}번째로 옮겼습니다. 변경사항 저장을 눌러 확정해주세요.`;
}

function addProductCategory() {
  if (mappingSaveButton.disabled) return;
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
  mappingDirty = true;
  categoryAddInput.value = "";
  updateCategoryManagerOptions(category);
  renderMappingSummary();
  renderMappingRows();
  mappingStatus.textContent = `${category} 카테고리를 추가했습니다. 변경사항 저장을 눌러 확정해주세요.`;
  window.alert("추가한 카테고리는 변경사항 저장을 눌러야 확실히 저장됩니다.");
}

function renameProductCategory() {
  if (mappingSaveButton.disabled) return;
  const previous = categoryManageSelect.value;
  const next = String(categoryRenameInput.value || "").trim();
  if (!previous || !next || previous === next) return;
  if (["총합계", "미지정"].includes(next) || productCategories.some((item) => item !== previous && normalizeText(item) === normalizeText(next))) {
    mappingStatus.textContent = "이미 사용 중이거나 예약된 카테고리 이름입니다.";
    return;
  }

  productCategories = productCategories.map((category) => category === previous ? next : category);
  mappingDirty = true;
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
  if (mappingSaveButton.disabled) return;
  const category = categoryManageSelect.value;
  if (!category || productCategories.length <= 1) return;
  const mappedCount = [...categoryMappings.values()].filter((item) => mappingCategoriesFromItem(item).includes(category)).length;
  const confirmed = window.confirm(
    `${category} 카테고리를 삭제할까요?\n${mappedCount}개 키워드에서 이 카테고리만 해제되며, 함께 지정된 다른 카테고리는 유지됩니다.`
  );
  if (!confirmed) return;

  productCategories = productCategories.filter((item) => item !== category);
  mappingDirty = true;
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

function autoProductCategorySuggestionsFor(keyword) {
  const primary = autoProductCategoryFor(keyword);
  if (["기타", "미지정"].includes(primary)) return [primary];
  return [...new Set([primary, ...baseAutoProductCategoriesFor(keyword).map(resolveCategoryName).filter((category) => productCategories.includes(category))])];
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
    const suggestions = autoProductCategorySuggestionsFor(row.keyword);
    if (mappingReview(manualCategoriesFor(row.keyword), suggestions).priority !== 2) continue;
    updateCategoryMapping(row.keyword, suggestions[0]);
    appliedCount += 1;
  }

  mappingFilter.value = "review";
  renderMappingSummary();
  renderMappingRows();
  mappingStatus.textContent = `${appliedCount}개 신규·재진입 키워드에 단일 추천을 적용했습니다. 임시 분류·추천 없음·복수 후보는 직접 확인해주세요. 변경사항 저장을 눌러 확정해주세요.`;
  mappingApplySuggestionsButton.disabled = true;
}

async function renderCategoryStatusSheet(options = {}) {
  const version = ++categoryStatusRenderVersion;
  const mode = categoryStatusMode;
  const custom = mode === "custom";
  const available = categoryStatusPeriodOptions(mode);
  const selected = categoryStatusSelections.get(mode) || new Set(
    (mode === "month" ? available : available.slice(0, 1)).map((period) => period.key)
  );
  if (available.length) categoryStatusSelections.set(mode, selected);

  if (!options.keepPeriodList) renderCategoryStatusPeriods(available, selected);
  const periods = custom ? available : available.filter((period) => selected.has(period.key));
  const keys = [...new Set(periods.flatMap((period) => period.reportKeys))];
  if (options.refreshReports) reportCache = new Map();
  if (!keys.length) {
    const message = !reportKeys.length ? "저장된 자료가 없습니다."
      : custom ? (categoryStatusCustomKey
        ? "입력한 날짜와 일치하는 리포트가 없습니다. 상단에서 같은 기간을 먼저 수집해주세요."
        : "시작일과 종료일을 입력하고 기간을 적용해주세요.")
      : available.length ? "조회할 기간을 선택해주세요."
      : mode === "month" ? "달력 월 전체를 수집한 자료가 없습니다."
      : `${COMPARISON_MODES[mode].label}로 조회할 연속된 완전한 월 자료가 없습니다.`;
    clearCategoryStatusView(message);
    return;
  }

  clearCategoryStatusView("선택한 기간의 자료를 불러오는 중입니다.");
  categoryStatusRefreshButton.disabled = true;
  try {
    const reports = await Promise.all(keys.map(fetchReport));
    if (version !== categoryStatusRenderVersion) return;
    if (reports.some((report) => !report)) {
      throw new Error("선택한 기간의 자료를 불러오지 못했습니다. 새로고침으로 다시 시도해주세요.");
    }

    const grouped = buildComparisonPeriods(reports, custom ? "month" : mode, periods.map((period) => period.key));
    if (grouped.periods.length !== periods.length) {
      throw new Error("선택한 기간의 월 자료가 불완전합니다. 기간을 다시 선택해주세요.");
    }
    categoryStatusReports = grouped.periods;
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
    categoryStatusPeriodMessage.textContent = custom
      ? periodLabel(categoryStatusReports[0])
      : `${categoryStatusReports.length}개 기간 조회 · ${grouped.note}`;
    categoryStatusDownloadButton.disabled = false;
  } catch (error) {
    if (version === categoryStatusRenderVersion) clearCategoryStatusView(error.message);
  } finally {
    if (version === categoryStatusRenderVersion) categoryStatusRefreshButton.disabled = false;
  }
}

function categoryStatusPeriodOptions(mode) {
  if (mode === "custom") {
    const key = [...reportKeys].sort().find((item) => reportSortValue(item) === categoryStatusCustomKey);
    return key ? [{ key, reportKeys: [key] }] : [];
  }
  if (mode !== "month") return buildComparisonOptions(reportKeys, mode).reverse();

  const byMonth = new Map();
  for (const key of [...reportKeys].sort()) {
    const month = completeMonthKey(key);
    if (month && !byMonth.has(month)) byMonth.set(month, key);
  }
  return buildComparisonOptions([...byMonth.values()].reverse(), mode);
}

function renderCategoryStatusPeriods(periods, selected) {
  const mode = categoryStatusMode;
  const custom = mode === "custom";
  for (const button of categoryStatusModeButtons) {
    const active = button.dataset.categoryStatusMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  categoryStatusCustomForm.hidden = !custom;
  categoryStatusPeriodList.hidden = custom;
  categoryStatusPeriodHelp.textContent = custom ? "입력한 시작일과 종료일이 일치하는 저장 리포트를 조회합니다."
    : mode === "month" ? "조회할 월을 선택하세요."
    : comparisonMethodText(mode);
  categoryStatusPeriodList.replaceChildren(...periods.map((period) => comparisonPeriodOption(period, selected)));
}

function clearCategoryStatusView(message) {
  categoryStatusReports = [];
  categoryStatusRows = [];
  categoryStatusRefreshButton.disabled = false;
  categoryStatusDownloadButton.disabled = true;
  categoryStatusPeriodMessage.textContent = message;
  categoryStatusSummary.replaceChildren();
  renderCategoryStatusList();
  renderCategoryDetail();
  updateStatusSeriesOptions();
  renderCategoryRankChart();
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
    comparisonMetricHtml("고유 키워드", `${keywords.length}개`, "선택한 기간 기준"),
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
  const keywords = filteredCategoryStatusKeywords(row);

  if (!keywords.length) {
    categoryKeywordBody.innerHTML = `<tr><td colspan="4">조건에 맞는 하부 키워드가 없습니다.</td></tr>`;
    return;
  }

  categoryKeywordBody.innerHTML = keywords.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.keyword)}</strong></td>
      <td>${assignmentBadgeHtml(item.assignmentType)}</td>
      <td>${escapeHtml(categoryStatusLatestPeriodLabel(item))}</td>
      <td>${item.latestRank ? `${item.latestRank}위` : "-"}</td>
    </tr>
  `).join("");
}

function filteredCategoryStatusKeywords(row) {
  const search = normalizeText(categoryKeywordSearch.value);
  return row.keywords.filter((item) => !search || item.key.includes(search));
}

function categoryStatusLatestPeriodLabel(keyword) {
  const latest = categoryStatusReports.find((report) => report.month === keyword.latestPeriod);
  return periodLabel(latest || keyword.latestPeriod);
}

function assignmentLabel(type) {
  return { manual: "직접 지정", automatic: "자동 규칙", unmapped: "미지정" }[type] || "미지정";
}

function assignmentBadgeHtml(type) {
  return `<span class="assignment-badge ${type}">${assignmentLabel(type)}</span>`;
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
  hideCategoryRankTooltip();
  const reports = categoryStatusReports;
  const series = selectedTrendSeries.map((item) => ({ ...item, points: trendSeriesPoints(item) }));
  const observed = series.flatMap((item) => item.points).filter(Number.isFinite);
  if (!reports.length || !observed.length) {
    categoryRankChart.setAttribute("viewBox", "0 0 480 96");
    categoryRankChart.style.removeProperty("min-width");
    const message = !reports.length ? "조회 기간의 자료가 없습니다."
      : series.length ? "선택한 기간에 표시할 순위가 없습니다."
      : "표시할 카테고리나 키워드를 추가해주세요.";
    categoryRankChart.innerHTML = `<text x="24" y="48" class="chart-empty">${message}</text>`;
    categoryRankLegend.replaceChildren();
    return;
  }

  const colors = ["#168246", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be123c", "#4d7c0f", "#9333ea", "#0f766e", "#c2410c", "#475569"];
  const width = Math.max(920, reports.length * 128);
  const height = 360;
  const padding = { top: 22, right: 24, bottom: 68, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxObserved = Math.max(50, ...observed);
  const maxRank = Math.min(500, Math.ceil(maxObserved / 50) * 50);
  const slotWidth = chartWidth / reports.length;
  const x = (index) => padding.left + slotWidth * (index + 0.5);
  const y = (rank) => padding.top + chartHeight * (Number(rank) - 1) / Math.max(1, maxRank - 1);
  const ticks = [...new Set([1, Math.ceil(maxRank * 0.25), Math.ceil(maxRank * 0.5), Math.ceil(maxRank * 0.75), maxRank])];
  const keywords = series.filter((item) => item.type === "keyword");
  const barWidth = Math.min(28, slotWidth * 0.7 / Math.max(1, keywords.length));
  const seriesColor = (item) => colors[series.indexOf(item) % colors.length];
  const rankLabel = (item, index, rank) => `${item.value}${item.type === "category" ? " (카테고리 최고)" : ""}\n${periodLabel(reports[index])}\n${rank}위`;

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
    ${keywords.map((item, keywordIndex) => item.points.map((rank, periodIndex) => {
      if (!Number.isFinite(rank)) return "";
      const barX = x(periodIndex) + (keywordIndex - keywords.length / 2) * barWidth;
      const barHeight = Math.max(2, y(maxRank) - y(rank));
      return `<rect x="${barX + barWidth * 0.08}" y="${y(maxRank) - barHeight}" width="${barWidth * 0.84}" height="${barHeight}" rx="2" fill="${seriesColor(item)}" ${categoryRankMarkAttributes(rankLabel(item, periodIndex, rank))}></rect>`;
    }).join("")).join("")}
    ${series.filter((item) => item.type === "category").map((item) =>
      renderRankSeriesSvg(item, seriesColor(item), x, y, rankLabel)).join("")}
  `;

  categoryRankLegend.innerHTML = series.map((item, index) => `
    <div class="rank-legend-item">
      <span class="rank-legend-swatch" style="background:${colors[index % colors.length]}"></span>
      <span><strong>${escapeHtml(item.value)}</strong><small>${item.type === "category" ? "카테고리 최고 순위" : "개별 키워드 순위"}</small></span>
    </div>
  `).join("");
}

function renderRankSeriesSvg(series, color, x, y, rankLabel) {
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
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" pointer-events="none"></path>`;
  }).join("");
  const points = series.points.map((rank, index) => Number.isFinite(rank) ? `
    <circle cx="${x(index)}" cy="${y(rank)}" r="4" fill="${color}" ${categoryRankMarkAttributes(rankLabel(series, index, rank))}></circle>
  ` : "").join("");
  return `<g>${paths}${points}</g>`;
}

function categoryRankMarkAttributes(detail) {
  return `tabindex="0" role="img" aria-label="${escapeHtml(detail.replaceAll("\n", ", "))}" data-rank-detail="${escapeHtml(detail)}"`;
}

function showCategoryRankTooltip(event) {
  const mark = event.target.closest("[data-rank-detail]");
  if (!mark) return;
  categoryRankTooltipMark = mark;
  categoryRankTooltip.textContent = mark.dataset.rankDetail;
  positionCategoryRankTooltip(mark);
}

function positionCategoryRankTooltip(mark) {
  const frame = categoryRankTooltip.parentElement.getBoundingClientRect();
  const box = mark.getBoundingClientRect();
  if (box.right < frame.left || box.left > frame.right) {
    hideCategoryRankTooltip();
    return;
  }
  categoryRankTooltip.hidden = false;
  const width = categoryRankTooltip.offsetWidth;
  const height = categoryRankTooltip.offsetHeight;
  const center = (box.left + box.right) / 2 - frame.left;
  const x = Math.max(0, Math.min(center - width / 2, frame.width - width));
  const above = box.top - frame.top - height - 8;
  const y = above >= 0 ? above : box.top - frame.top + Math.min(box.height, 9);
  categoryRankTooltip.style.left = `${x}px`;
  categoryRankTooltip.style.top = `${y}px`;
}

function hideCategoryRankTooltip() {
  categoryRankTooltipMark = null;
  categoryRankTooltip.hidden = true;
}

function downloadCategoryStatusXlsx() {
  if (!categoryStatusReports.length) return;
  const periods = categoryStatusReports;
  const periodLabels = periods.map((report) => `${report.startDate} ~ ${report.endDate}`);
  const category = categoryStatusRows.find((row) => row.category === selectedStatusCategory);
  const modeLabel = COMPARISON_MODES[categoryStatusMode]?.label || "직접 선택";
  const method = categoryStatusMode === "custom" ? "선택한 날짜와 일치하는 저장 리포트의 검색 순위를 사용합니다."
    : comparisonMethodText(categoryStatusMode);
  const rows = [
    ["카테고리 현황", modeLabel],
    ["순위 기준", method],
    [],
    ["그래프 선택 항목"],
    ["종류", "항목", ...periodLabels],
    ...selectedTrendSeries.map((series) => {
      const ranks = trendSeriesPoints(series);
      return [series.type === "category" ? "카테고리 최고 순위" : "키워드 순위", series.value,
        ...periods.map((_, index) => ranks[index] ?? "")];
    }),
    [],
    ["카테고리 현황", category.category],
    ["조회 기간", "최고 순위", "Top 100 개수", "Top 500 개수"],
    ...category.points.map((point, index) => [periodLabels[index], point.bestRank ?? "", point.top100Count, point.top500Count]),
    [],
    ["하부 키워드", categoryKeywordSearch.value.trim()],
    ["키워드", "적용 방식", "최근 진입 기간", "최근 순위", ...periodLabels],
    ...filteredCategoryStatusKeywords(category).map((keyword) => [
      keyword.keyword,
      assignmentLabel(keyword.assignmentType),
      categoryStatusLatestPeriodLabel(keyword),
      keyword.latestRank ?? "",
      ...keyword.periodRanks.map((rank) => rank ?? "")
    ])
  ];
  const widths = [29, 32, 45, 29, ...periods.map(() => 29)];
  const blob = createXlsxBlob("카테고리 현황", rows, widths);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `category-status_${categoryStatusMode}_${safeFileName(periods[0].startDate)}_${safeFileName(periods.at(-1).endDate)}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  const version = ++comparisonRenderVersion;
  initializeComparisonSelection();
  pruneComparisonSelection();
  if (!options.keepPeriodList) {
    renderComparisonPeriodList();
  }

  const selectedPeriods = buildComparisonOptions(reportKeys, comparisonMode).filter((option) => comparisonSelectedKeys.has(option.key));
  const selectedKeys = chronologicalReportKeys([...new Set(selectedPeriods.flatMap((option) => option.reportKeys))]);
  const modeConfig = COMPARISON_MODES[comparisonMode];
  comparisonStatus.textContent = `${selectedPeriods.length}개 기간 선택 · ${modeConfig.label} 비교`;
  comparisonDownloadButton.disabled = true;
  comparisonPdfDownloadButton.disabled = true;

  if (selectedPeriods.length < 2) {
    const message = comparisonMode === "month"
      ? "비교할 기간을 2개 이상 선택해주세요."
      : `비교할 ${modeConfig.label} 기간을 2개 이상 선택해주세요. 각 기간에는 연속된 ${modeConfig.monthCount}개월의 완전한 월 자료가 필요합니다.`;
    clearComparisonView(message);
    return;
  }

  comparisonStatus.textContent = `${selectedKeys.length}개 저장 자료를 불러와 ${modeConfig.label} 순위를 계산하는 중입니다.`;
  if (options.refreshReports) reportCache = new Map();

  const rawReports = (await Promise.all(selectedKeys.map((key) => fetchReport(key)))).filter(Boolean);
  if (version !== comparisonRenderVersion) return;
  if (rawReports.length !== selectedKeys.length) {
    clearComparisonView("선택한 자료 중 일부를 불러오지 못했습니다.");
    return;
  }

  const grouped = buildComparisonPeriods(rawReports, comparisonMode, selectedPeriods.map((option) => option.key));
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
  comparisonRangeLabel.textContent = `키워드 요약 ${periodLabel(previous)} 대비 ${periodLabel(latest)} · 제품군 증감 ${periodLabel(first)} 대비 ${periodLabel(latest)} · ${comparisonMethodText(comparisonMode)}`;
  comparisonStatus.textContent = `${selectedKeys.length}개 저장 자료로 ${reports.length}개 ${modeConfig.label} 기간 비교 중 · ${grouped.note}`;
  comparisonDownloadButton.disabled = false;
  comparisonPdfDownloadButton.disabled = false;
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

function initializeComparisonSelection() {
  if (comparisonSelectionLoaded) return;
  comparisonSelectionLoaded = true;

  const saved = localStorage.getItem(comparisonSelectionStorageKey());
  if (saved !== null) {
    try {
      const keys = JSON.parse(saved);
      comparisonSelectedKeys = new Set(Array.isArray(keys) ? keys : []);
      return;
    } catch {
      comparisonSelectedKeys = new Set();
    }
  }

  if (comparisonMode === "month") {
    comparisonSelectedKeys = new Set(chronologicalReportKeys(reportKeys).slice(-2));
  } else {
    const periods = buildComparisonOptions(reportKeys, comparisonMode);
    const latest = periods.at(-1);
    const previous = latest && (periods.findLast((option) => option.endDate < latest.startDate) || periods.at(-2));
    comparisonSelectedKeys = new Set([previous, latest].filter(Boolean).map((option) => option.key));
  }
}

function pruneComparisonSelection() {
  const validKeys = new Set(buildComparisonOptions(reportKeys, comparisonMode).map((option) => option.key));
  const nextKeys = [...comparisonSelectedKeys].filter((key) => validKeys.has(key));
  if (nextKeys.length === comparisonSelectedKeys.size) return;

  comparisonSelectedKeys = new Set(nextKeys);
  saveComparisonSelection();
}

function saveComparisonSelection() {
  localStorage.setItem(comparisonSelectionStorageKey(), JSON.stringify([...comparisonSelectedKeys]));
}

function comparisonSelectionStorageKey() {
  return comparisonMode === "month" ? COMPARISON_SELECTION_STORAGE_KEY : `${COMPARISON_SELECTION_STORAGE_KEY}:${comparisonMode}`;
}

function renderComparisonPeriodList() {
  comparisonPeriodList.replaceChildren();
  comparisonPeriodLegend.textContent = comparisonMode === "month" ? "비교에 사용할 저장 자료" : `비교할 ${COMPARISON_MODES[comparisonMode].label} 기간`;
  comparisonPeriodHelp.textContent = comparisonMode === "month" ? "비교할 저장 자료를 선택하세요."
    : comparisonMode === "year" ? "각 연도 1~12월 전체를 묶어 비교합니다."
    : `원하는 시작월의 연속 ${COMPARISON_MODES[comparisonMode].monthCount}개월 기간을 각각 선택하세요. 서로 겹치는 기간도 비교할 수 있습니다.`;

  if (!reportKeys.length) {
    comparisonPeriodList.innerHTML = `<p class="empty">저장된 자료가 없습니다.</p>`;
    return;
  }

  const periods = buildComparisonOptions(reportKeys, comparisonMode);
  if (!periods.length) {
    comparisonPeriodList.innerHTML = `<p class="empty">${COMPARISON_MODES[comparisonMode].label}로 묶을 연속된 완전한 월 자료가 없습니다.</p>`;
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const option of comparisonMode === "month" ? periods : periods.toReversed()) {
    fragment.append(comparisonPeriodOption(option, comparisonSelectedKeys));
  }

  comparisonPeriodList.append(fragment);
}

function comparisonPeriodOption(option, selected) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  const text = document.createElement("span");
  label.className = "comparison-period-option";
  input.type = "checkbox";
  input.dataset.reportKey = option.key;
  input.checked = selected.has(option.key);
  text.textContent = option.label || periodLabel(option.key);
  label.append(input, text);
  return label;
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
  let failureMessage = "";
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
    const missing = [...baselineKeys.filter((key, index) => !baselineReports[index]), ...currentKeys.filter((key, index) => !currentReports[index])];
    if (missing.length) throw new Error(`선택한 기간 자료를 불러오지 못했습니다: ${missing.map(periodLabel).join(", ")}. 다시 시도해주세요.`);
    const prepareReports = (reports) => reports.map((report) => ({
      month: report.month,
      startDate: report.startDate,
      endDate: report.endDate,
      rows: (report.rows || []).map((row) => ({
        rank: Number(row.rank),
        keyword: row.keyword,
        categories: productCategoriesFor(row.keyword)
      }))
    }));
    const response = await adminRequest("/api/executive-report", {
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
    failureMessage = error.message;
  } finally {
    executivePdfDownloadButton.textContent = originalText;
    updateExecutiveReportState();
    if (failureMessage) executiveReportStatus.textContent = failureMessage;
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
  comparisonPdfDownloadButton.disabled = true;
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
    const changes = buildKeywordRankChanges(points);
    const latestChange = changes.at(-1);
    const categories = productCategoriesFor(keyword);

    return {
      key,
      keyword,
      categories,
      category: formatProductCategories(categories),
      points,
      changes,
      previous,
      latest,
      rankDelta: latestChange?.delta ?? null,
      changeType: latestChange?.type === "returning" ? "new" : latestChange?.type
    };
  }).sort((a, b) => {
    if (a.latest && !b.latest) return -1;
    if (!a.latest && b.latest) return 1;
    return Number(a.latest?.rank || a.previous?.rank || 9999) - Number(b.latest?.rank || b.previous?.rank || 9999);
  });
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
  comparisonKeywordHead.innerHTML = `
    <tr>
      <th>검색어</th>
      <th>제품군</th>
      ${reports.map((report) => `<th>${periodHeadingHtml(report)}<br>검색 순위</th>`).join("")}
    </tr>
  `;
}

function renderComparisonKeywordRows() {
  if (!comparisonReports.length) return;

  const search = normalizeText(comparisonKeywordSearch.value);
  const filter = comparisonKeywordFilter.value;
  const rows = comparisonKeywordRows.filter((row) => {
    if (filter !== "all" && !row.changes.some((change) => change?.type === filter)) return false;
    return !search || normalizeText(row.keyword).includes(search) || normalizeText(row.category).includes(search);
  });

  comparisonKeywordStatus.textContent = `선택 기간 ${comparisonReports.length}개 · 전체 키워드 ${comparisonKeywordRows.length}개 중 ${rows.length}개 표시`;
  if (!rows.length) {
    comparisonKeywordBody.innerHTML = `<tr><td colspan="${comparisonReports.length + 2}">조건에 맞는 키워드가 없습니다.</td></tr>`;
    return;
  }

  comparisonKeywordBody.innerHTML = rows.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.keyword)}</strong></td>
      <td>${escapeHtml(row.category)}</td>
      ${row.points.map((point, index) => comparisonKeywordCellHtml(point, row.changes[index])).join("")}
    </tr>
  `).join("");
}

function comparisonKeywordCellHtml(point, change) {
  const rank = point ? `${Number(point.rank)}위` : '<span aria-label="순위권 밖">–</span>';
  if (!change) return `<td>${rank}</td>`;
  const detail = change.delta == null
    ? changeBadgeHtml(change.type)
    : `<span class="${deltaClass(change.delta)}">${change.delta ? formatRankDelta(change.delta) : "변동 없음"}</span>`;
  return `<td>${rank}<small class="comparison-keyword-change">${detail}</small></td>`;
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
  const className = ["new", "returning", "rising"].includes(type) ? "positive" : ["falling", "exited"].includes(type) ? "negative" : "";
  return `<span class="change-badge ${className}">${comparisonChangeLabel(type)}</span>`;
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
    ["키워드 비교", "변동은 바로 앞 선택 기간 기준"],
    [
      "검색어",
      "제품군",
      ...periodLabels.flatMap((label, index) => [
        `${label} 검색 순위`,
        ...(index ? [`${label} 순위 변동`] : [])
      ])
    ],
    ...comparisonKeywordRows.map((row) => [
      row.keyword,
      row.category,
      ...row.points.flatMap((point, index) => {
        const rank = point ? Number(point.rank) : "";
        if (!index) return [rank];
        const change = row.changes[index];
        return [rank, change ? change.delta ?? comparisonChangeLabel(change.type) : ""];
      })
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

async function downloadComparisonPdf() {
  if (comparisonReports.length < 2) return;

  const fileName = `comparison_${comparisonMode}_${safeFileName(comparisonReports[0].month)}_${safeFileName(comparisonReports.at(-1).month)}.pdf`;
  comparisonPdfDownloadButton.disabled = true;
  const originalText = comparisonPdfDownloadButton.textContent;
  comparisonPdfDownloadButton.textContent = "PDF 작성 중";
  try {
    const response = await adminRequest("/api/comparison-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: buildComparisonPdfHtml() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "비교 PDF 생성에 실패했습니다.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    comparisonPdfDownloadButton.textContent = "다운로드 완료";
    comparisonStatus.textContent = "선택한 기간의 비교 내용을 PDF로 생성했습니다.";
  } catch (error) {
    comparisonPdfDownloadButton.textContent = "생성 실패";
    comparisonStatus.textContent = error.message || "비교 PDF를 생성하지 못했습니다.";
  } finally {
    window.setTimeout(() => {
      comparisonPdfDownloadButton.textContent = originalText;
      comparisonPdfDownloadButton.disabled = comparisonReports.length < 2;
    }, 1800);
  }
}

function buildComparisonPdfHtml() {
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
  const keywordTables = [];
  // A4 has room for six date columns beside the keyword and product group.
  for (let start = 0; start < comparisonReports.length; start += 6) {
    const end = start + 6;
    const headers = ["검색어", "제품군", ...comparisonReports.slice(start, end).map((report) => periodLabel(report))];
    const rows = comparisonKeywordRows
      .filter((row) => row.points.slice(start, end).some(Boolean) || row.changes[start]?.type === "exited")
      .map((row) => [
        row.keyword,
        row.category,
        ...row.points.slice(start, end).map((point, offset) => {
          const rank = point ? `${Number(point.rank)}위` : "–";
          const change = row.changes[start + offset];
          if (!change) return rank;
          const detail = change.delta ? formatRankDelta(change.delta) : comparisonChangeLabel(change.type);
          return `${rank} (${detail})`;
        })
      ]);
    keywordTables.push(reportTableHtml(headers, rows));
  }
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

  return `
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
      ${reportTableHtml(["검색어", "제품군", "이전 순위", "최신 순위", "순위 변동", "상태"], latestRows, "조건에 해당하는 최신 순위 변화가 없습니다.")}
      <h2 style="margin:26px 0 10px;font-size:18px;">제품군 순위 비교</h2>
      ${reportTableHtml(categoryHeaders, categoryRows)}
      <h2 style="margin:26px 0 5px;font-size:18px;">키워드 비교</h2>
      <div style="margin-bottom:10px;font-size:12px;color:#667482;">선택 기간 ${comparisonReports.length}개 · 변동은 바로 앞 선택 기간 기준</div>
      ${keywordTables.join('<div style="break-before:page"></div>')}
    </div>
  `;
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
    : { new: "신규 진입", returning: "재진입", rising: "순위 상승", falling: "순위 하락", exited: "Top 500 이탈", unchanged: "변동 없음" };
  return labels[type] || labels.unchanged;
}

function reportTableHtml(headers, rows, emptyMessage = "표시할 자료가 없습니다.") {
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyHtml = rows.length
    ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="${headers.length}" style="padding:10px;border:1px solid #d7dee8;color:#667482;font-size:12px;">${escapeHtml(emptyMessage)}</td></tr>`;
  return `<table class="comparison-report-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
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

function createXlsxBlob(sheetName, rows, columnWidths) {
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
    ["xl/worksheets/sheet1.xml", worksheetXml(rows, columnWidths)]
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

function worksheetXml(rows, columnWidths) {
  const sheetData = rows.map((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = row.map((value, columnIndex) => cellXml(value, rowNumber, columnIndex + 1)).join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join("");

  const columns = columnWidths
    ? columnWidths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("")
    : `<col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="24" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="6" width="18" customWidth="1"/>
    <col min="7" max="8" width="16" customWidth="1"/>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${columns}</cols>
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

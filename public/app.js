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

let selectedMonth = null;

setPreviousMonthDates();

previousMonthButton.addEventListener("click", () => {
  setPreviousMonthDates();
  statusText.textContent = "직전월 기간으로 설정했습니다.";
});

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
      const details = report.details ? ` (${String(report.details).slice(0, 160)})` : "";
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
await loadMonths();

async function loadHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) return;

    const health = await response.json();

    if (!health.naverConfigured) {
      statusText.textContent = "네이버 개발자센터에서 발급받은 Client ID / Secret을 Vercel 환경변수에 등록해야 합니다.";
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

  monthList.replaceChildren();

  if (!months.length) {
    monthList.innerHTML = `<p class="empty">아직 저장된 월별 자료가 없습니다.</p>`;
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
}

async function loadReport(month) {
  selectedMonth = month;
  statusText.textContent = `${month} 자료를 불러오는 중입니다.`;
  updateMonthSelection();

  const response = await fetch(`/api/monthly-report?month=${encodeURIComponent(month)}`);
  const report = await response.json();

  if (!response.ok) {
    statusText.textContent = report.error || "자료를 불러오지 못했습니다.";
    return;
  }

  renderReport(report);
  statusText.textContent = `${month} 자료를 표시 중입니다.`;
}

function renderReport(report) {
  selectedMonth = report.month;
  updateMonthSelection();

  reportTitle.textContent = `${report.month} 건강식품 Top ${report.count}`;
  reportMeta.textContent = `${report.startDate} ~ ${report.endDate} / ${report.categoryPath.join(" > ")}`;
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

function setPreviousMonthDates() {
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(firstOfThisMonth.getTime() - 86400000);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);

  startDateInput.value = formatDate(start);
  endDateInput.value = formatDate(end);
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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

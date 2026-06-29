const statusText = document.querySelector("#status");
const monthList = document.querySelector("#month-list");
const reportTitle = document.querySelector("#report-title");
const reportMeta = document.querySelector("#report-meta");
const reportBody = document.querySelector("#report-body");
const anchorKeyword = document.querySelector("#anchor-keyword");
const collectButton = document.querySelector("#collect-button");

let selectedMonth = null;

collectButton.addEventListener("click", async () => {
  collectButton.disabled = true;
  statusText.textContent = "직전월 데이터를 수집하는 중입니다.";

  try {
    const response = await fetch("/api/collect-monthly", { method: "POST" });
    const report = await response.json();
    if (!response.ok) throw new Error(report.error || "수집에 실패했습니다.");

    statusText.textContent = `${report.month} 수집이 완료되었습니다.`;
    await loadMonths(report.month);
    renderReport(report);
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    collectButton.disabled = false;
  }
});

await loadMonths();

async function loadMonths(preferredMonth = null) {
  const response = await fetch("/api/monthly-reports");
  const { months = [] } = response.ok ? await response.json() : { months: [] };

  monthList.replaceChildren();

  if (!months.length) {
    monthList.innerHTML = `<p class="empty">아직 저장된 월별 자료가 없습니다.</p>`;
    statusText.textContent = "직전월 수집을 실행하면 자료가 생성됩니다.";
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

const form = document.querySelector("#trend-form");
const statusText = document.querySelector("#status");
const rawOutput = document.querySelector("#raw-output");
const chart = document.querySelector("#chart");

const today = new Date();
const endDate = today.toISOString().slice(0, 10);
const start = new Date(today);
start.setMonth(start.getMonth() - 3);

form.elements.startDate.value = start.toISOString().slice(0, 10);
form.elements.endDate.value = endDate;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusText.textContent = "조회 중";
  chart.replaceChildren();
  rawOutput.textContent = "";

  const data = new FormData(form);
  const payload = {
    startDate: data.get("startDate"),
    endDate: data.get("endDate"),
    timeUnit: data.get("timeUnit"),
    category: data.get("category"),
    keywords: String(data.get("keywords") || "")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    device: data.get("device"),
    gender: data.get("gender")
  };

  try {
    const response = await fetch("/api/shopping-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "조회에 실패했습니다.");
    }

    statusText.textContent = "완료";
    rawOutput.textContent = JSON.stringify(result, null, 2);
    renderChart(result.results || []);
  } catch (error) {
    statusText.textContent = "오류";
    rawOutput.textContent = error.message;
  }
});

function renderChart(results) {
  if (!results.length) {
    chart.textContent = "표시할 데이터가 없습니다.";
    return;
  }

  const max = Math.max(
    1,
    ...results.flatMap((series) => (series.data || []).map((point) => Number(point.ratio) || 0))
  );

  for (const series of results) {
    const group = document.createElement("article");
    group.className = "series";

    const title = document.createElement("h3");
    title.textContent = series.title || "키워드";
    group.append(title);

    const bars = document.createElement("div");
    bars.className = "bars";

    for (const point of series.data || []) {
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${Math.max(3, (Number(point.ratio) / max) * 100)}%`;
      bar.title = `${point.period}: ${point.ratio}`;
      bars.append(bar);
    }

    group.append(bars);
    chart.append(group);
  }
}

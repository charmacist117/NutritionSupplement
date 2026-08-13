import { existsSync, readFileSync } from "node:fs";

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_REGION);
const KOREAN_FONT_DATA = IS_SERVERLESS
  ? ""
  : readFileSync(new URL("../fonts/NotoSansKR-Variable.ttf", import.meta.url)).toString("base64");

const MISSING_RANK = 501;

export async function createExecutiveReportPdf(input = {}) {
  const baseline = aggregatePeriod(input.baselineReports, "기준 구간");
  const current = aggregatePeriod(input.currentReports, "비교 구간");
  if (!baseline.rows.length || !current.rows.length) throw new Error("두 비교 구간의 리포트 자료가 필요합니다.");

  const analysis = analyzePeriods(baseline, current);
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(renderReportHtml(analysis), { waitUntil: "networkidle0" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      if (!document.fonts.check('12px "Noto Sans KR"', "건강식품 시장 보고서")) {
        throw new Error("PDF 한글 글꼴을 불러오지 못했습니다.");
      }
    });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" }
    });
  } finally {
    await browser.close();
  }
}

function aggregatePeriod(reports = [], fallbackLabel) {
  const sorted = reports.filter(Boolean).slice(0, 24).sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)));
  if (!sorted.length) return { label: fallbackLabel, startDate: "", endDate: "", rows: [] };
  const maps = sorted.map((report) => new Map((report.rows || []).slice(0, 500).map((row) => [normalize(row.keyword), normalizeReportRow(row)]).filter(([key]) => key)));
  const keys = new Set(maps.flatMap((rows) => [...rows.keys()]));
  const rows = [...keys].map((key) => {
    const points = maps.map((rows) => rows.get(key) || null);
    const latest = [...points].reverse().find(Boolean);
    const averageRank = points.reduce((sum, row) => sum + (row ? Number(row.rank) : MISSING_RANK), 0) / points.length;
    return {
      keyword: latest?.keyword || key,
      categories: unique((latest?.categories || ["기타"]).filter(Boolean)),
      averageRank,
      presentCount: points.filter(Boolean).length
    };
  }).sort((a, b) => a.averageRank - b.averageRank || b.presentCount - a.presentCount || a.keyword.localeCompare(b.keyword, "ko"))
    .slice(0, 500)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    label: sorted.length === 1 ? periodLabel(sorted[0]) : `${periodLabel(sorted[0])} ~ ${periodLabel(sorted.at(-1))}`,
    startDate: sorted[0].startDate,
    endDate: sorted.at(-1).endDate,
    sourceCount: sorted.length,
    rows
  };
}

function normalizeReportRow(row = {}) {
  return {
    rank: Math.max(1, Math.min(500, Number(row.rank) || 500)),
    keyword: String(row.keyword || "").trim().slice(0, 100),
    categories: unique((Array.isArray(row.categories) ? row.categories : ["기타"])
      .map((value) => String(value || "").trim().slice(0, 50))
      .filter(Boolean)).slice(0, 2)
  };
}

function analyzePeriods(baseline, current) {
  const before = new Map(baseline.rows.map((row) => [normalize(row.keyword), row]));
  const after = new Map(current.rows.map((row) => [normalize(row.keyword), row]));
  const keys = new Set([...before.keys(), ...after.keys()]);
  const keywordRows = [...keys].map((key) => {
    const previous = before.get(key) || null;
    const latest = after.get(key) || null;
    const keyword = latest?.keyword || previous?.keyword || key;
    const categories = latest?.categories || previous?.categories || ["기타"];
    const delta = previous && latest ? previous.rank - latest.rank : null;
    return { keyword, categories, previousRank: previous?.rank || null, latestRank: latest?.rank || null, delta,
      type: !previous ? "new" : !latest ? "exited" : delta > 0 ? "rising" : delta < 0 ? "falling" : "unchanged" };
  });
  const categoryNames = unique([...baseline.rows, ...current.rows].flatMap((row) => row.categories));
  const categoryRows = categoryNames.map((category) => {
    const previousRanks = baseline.rows.filter((row) => row.categories.includes(category)).map((row) => row.rank);
    const latestRanks = current.rows.filter((row) => row.categories.includes(category)).map((row) => row.rank);
    return {
      category,
      previousTop100: previousRanks.filter((rank) => rank <= 100).length,
      latestTop100: latestRanks.filter((rank) => rank <= 100).length,
      previousTop500: previousRanks.length,
      latestTop500: latestRanks.length,
      top100Delta: latestRanks.filter((rank) => rank <= 100).length - previousRanks.filter((rank) => rank <= 100).length,
      top500Delta: latestRanks.length - previousRanks.length
    };
  }).sort((a, b) => Math.abs(b.top500Delta) - Math.abs(a.top500Delta) || a.category.localeCompare(b.category, "ko"));
  const rising = keywordRows.filter((row) => row.delta > 0).sort((a, b) => b.delta - a.delta);
  const falling = keywordRows.filter((row) => row.delta < 0).sort((a, b) => a.delta - b.delta);
  const newTop100 = keywordRows.filter((row) => row.type === "new" && row.latestRank <= 100).sort((a, b) => a.latestRank - b.latestRank);
  const exited = keywordRows.filter((row) => row.type === "exited").sort((a, b) => a.previousRank - b.previousRank);
  const top20 = current.rows.slice(0, 20).map((row) => {
    const prior = before.get(normalize(row.keyword));
    return { ...row, previousRank: prior?.rank || null, delta: prior ? prior.rank - row.rank : null };
  });
  return { baseline, current, keywordRows, categoryRows, rising, falling, newTop100, exited, top20 };
}

function renderReportHtml(data) {
  const { baseline, current, categoryRows, rising, falling, newTop100, exited, top20 } = data;
  const biggestRise = rising[0];
  const biggestFall = falling[0];
  const expand = categoryRows.filter((row) => row.top500Delta > 0).slice(0, 8);
  const contract = categoryRows.filter((row) => row.top500Delta < 0).slice(0, 8);
  const stableTop = top20.filter((row) => row.delta === 0).slice(0, 3);
  const headline = makeHeadline(data);
  const insight = makeExecutiveInsight(data);
  const generated = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" }).format(new Date());
  const table = (headers, rows, widths = []) => `<table><thead><tr>${headers.map((h, i) => `<th style="${widths[i] ? `width:${widths[i]}` : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
  const categoryTable = (rows) => table(["카테고리", "기준 TOP 100", "비교 TOP 100", "변화", "기준 TOP 500", "비교 TOP 500", "변화"], rows.map((r) => `<tr><td><b>${e(r.category)}</b></td><td>${r.previousTop100}</td><td>${r.latestTop100}</td><td class="${tone(r.top100Delta)}">${signed(r.top100Delta)}</td><td>${r.previousTop500}</td><td>${r.latestTop500}</td><td class="${tone(r.top500Delta)}">${signed(r.top500Delta)}</td></tr>`));
  const moverTable = (rows, direction) => table(["비교 순위", "검색어", "카테고리", "순위 변화"], rows.slice(0, 12).map((r) => `<tr><td>${r.latestRank || "-"}</td><td><b>${e(r.keyword)}</b></td><td>${e(r.categories.join(" · "))}</td><td class="${direction}">${r.delta == null ? "신규" : signed(r.delta) + "위"}</td></tr>`), ["14%", "35%", "32%", "19%"]);
  const page = (section, title, body, extra = "") => `<section class="page"><header><span>HEALTH MARKET</span><span>${e(current.label)}</span></header><main><div class="section-no">${section}</div><h1>${title}</h1>${extra}${body}</main><footer><b>Health Market</b><span>네이버 쇼핑인사이트 · 검색 순위 기준 · 클릭량 수치 미사용</span></footer></section>`;

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${reportCss()}</style></head><body>
    <section class="page cover"><main><p class="eyebrow">네이버 쇼핑인사이트 기반 분석</p><h1>Health<br><i>Market</i></h1><h2>건강식품 시장 트렌드 종합 인사이트 보고서</h2><div class="cover-metrics">${metric(`${newTop100.length}개`, "TOP 100 신규 진입", "coral")}${metric(biggestRise ? `+${biggestRise.delta}` : "0", "최대 순위 상승", "green")}${metric(`${exited.length}개`, "TOP 500 이탈", "navy")}${metric(contract[0] ? `${contract[0].top500Delta}` : "0", "최대 카테고리 감소", "gold")}</div><div class="cover-meta"><span><small>비교 기간</small>${e(baseline.label)}<br>vs ${e(current.label)}</span><span><small>데이터 출처</small>네이버 쇼핑인사이트</span><span><small>분석 범위</small>건강식품 인기검색어 TOP 500</span><span><small>작성일</small>${generated}</span></div></main></section>
    ${page("01 — EXECUTIVE SUMMARY", "핵심 요약", `<div class="lead"><b>이달의 한 줄 요약</b><p>${e(headline)}</p></div><div class="metrics">${metric(`${newTop100.length}개`, "TOP 100 신규 진입", "coral")}${metric(biggestRise ? `+${biggestRise.delta}` : "0", `최대 상승 · ${e(biggestRise?.keyword || "없음")}`, "green")}${metric(biggestFall ? `${biggestFall.delta}` : "0", `최대 하락 · ${e(biggestFall?.keyword || "없음")}`, "navy")}${metric(`${exited.length}개`, "TOP 500 이탈", "gold")}</div><div class="insight-grid"><article><h3>순위권 확대 카테고리</h3><p>${e(categorySentence(expand, true))}</p></article><article><h3>순위권 축소 카테고리</h3><p>${e(categorySentence(contract, false))}</p></article><article><h3>상위권 구도</h3><p>${e(stableTop.length ? `${stableTop.map((r) => `${r.keyword}(${r.rank}위)`).join("·")}은 순위를 유지했습니다.` : "TOP 20에서 순위를 그대로 유지한 키워드가 제한적입니다.")}</p></article><article><h3>최대 변동 키워드</h3><p>${e(biggestRise ? `${biggestRise.keyword}이 ${biggestRise.delta}위 상승했습니다.` : "뚜렷한 상승 키워드가 없습니다.")} ${e(biggestFall ? `${biggestFall.keyword}은 ${Math.abs(biggestFall.delta)}위 하락했습니다.` : "")}</p></article></div>`) }
    ${page("02 — TOP 20 STRUCTURE", "TOP 20 구도 변화", table(["비교 순위", "검색어", "카테고리", "기준 순위", "변화"], top20.map((r) => `<tr><td>${r.rank}</td><td><b>${e(r.keyword)}</b></td><td>${e(r.categories.join(" · "))}</td><td>${r.previousRank || "-"}</td><td class="${tone(r.delta)}">${r.previousRank ? (r.delta ? signed(r.delta) + "위" : "유지") : "신규"}</td></tr>`), ["13%", "29%", "30%", "14%", "14%"]), `<p class="sub">${e(current.label)} TOP 20와 ${e(baseline.label)} 순위를 비교합니다.</p>`) }
    ${page("03 — CATEGORY DISTRIBUTION", "카테고리별 순위권 변화", `${categoryTable(categoryRows.filter((r) => r.top100Delta || r.top500Delta).slice(0, 18))}<div class="key-insight"><b>KEY INSIGHT</b><p>${e(categorySentence([...expand.slice(0, 3), ...contract.slice(0, 3)], true))}</p></div>`, `<p class="sub">각 카테고리에 속한 키워드의 TOP 100·TOP 500 진입 수를 비교합니다. 하나의 키워드가 두 카테고리에 지정된 경우 양쪽에 모두 반영됩니다.</p>`) }
    ${page("04 — RANK MOVERS", "급상승·급하락 키워드", `<div class="two-col"><div><h3>급상승 TOP 12</h3>${moverTable(rising, "positive")}</div><div><h3>급하락 TOP 12</h3>${moverTable(falling, "negative")}</div></div><div class="key-insight"><b>READING GUIDE</b><p>큰 순위 변동은 단기 이슈의 신호입니다. 원인과 지속성은 판매·광고·콘텐츠·계절 자료를 함께 확인한 뒤 판단해야 합니다.</p></div>`, `<p class="sub">두 구간 모두 TOP 500에 존재하는 동일 검색어의 순위 차이입니다.</p>`) }
    ${page("05 — NEW ENTRANTS", "신규 진입 키워드 (TOP 100)", `${moverTable(newTop100, "positive")}<div class="key-insight"><b>KEY INSIGHT</b><p>${e(newTop100.length ? `${newTop100.slice(0, 5).map((r) => r.keyword).join("·")} 등이 비교 구간 TOP 100에 새로 진입했습니다. 신규 수요의 지속 여부를 다음 기간에도 추적할 필요가 있습니다.` : "비교 구간 TOP 100에 새로 진입한 키워드가 없습니다.")}</p></div>`, `<p class="sub">기준 구간 TOP 500에 없었으나 비교 구간 TOP 100에 진입한 검색어입니다.</p>`) }
    ${page("06 — STRATEGIC IMPLICATIONS", "전략적 시사점 및 제언", `<div class="recommendations">${recommendations(data).map((r) => `<article><h3>${e(r.title)}</h3><p>${e(r.body)}</p></article>`).join("")}</div><div class="conclusion"><h2>결론 — 경영진께 드리는 한 마디</h2><p>${e(insight)}</p></div><div class="method"><b>분석 기준</b><p>각 구간이 여러 달인 경우 월별 검색 순위를 평균하고, 미등장 월은 501위로 반영한 뒤 구간 내 1~500위로 재순위화했습니다. 클릭량 점수는 기간 간 비교에 사용하지 않았습니다.</p></div>`)}
  </body></html>`;
}

function makeHeadline({ current, rising, falling, newTop100, categoryRows }) {
  const expand = categoryRows.filter((r) => r.top500Delta > 0).sort((a, b) => b.top500Delta - a.top500Delta)[0];
  const contract = categoryRows.filter((r) => r.top500Delta < 0).sort((a, b) => a.top500Delta - b.top500Delta)[0];
  const parts = [`${current.label} 건강식품 검색 시장은`];
  if (expand) parts.push(`${expand.category} 카테고리의 순위권 키워드 확대`);
  if (contract) parts.push(`${contract.category} 카테고리의 축소`);
  if (newTop100.length) parts.push(`TOP 100 신규 진입 ${newTop100.length}개`);
  if (rising[0]) parts.push(`${rising[0].keyword}의 ${rising[0].delta}위 상승`);
  if (!rising.length && !falling.length) parts.push("상위 검색 구조의 안정세");
  return `${parts.join(", ")}가 핵심 변화로 확인됩니다.`;
}

function makeExecutiveInsight(data) {
  const expand = data.categoryRows.filter((r) => r.top500Delta > 0).sort((a, b) => b.top500Delta - a.top500Delta)[0];
  const contract = data.categoryRows.filter((r) => r.top500Delta < 0).sort((a, b) => a.top500Delta - b.top500Delta)[0];
  return `${data.current.label}의 핵심 메시지는 검색 순위와 카테고리 폭의 재배치입니다. ${expand ? `${expand.category}는 TOP 500 키워드가 ${expand.top500Delta}개 늘어 탐색 범위가 확대됐고, ` : ""}${contract ? `${contract.category}는 ${Math.abs(contract.top500Delta)}개 줄어 축소됐습니다. ` : ""}신규·급상승 키워드는 초기 수요 신호로 추적하되, 검색 순위만으로 원인을 단정하지 말고 판매 및 캠페인 데이터와 교차 검증하는 운영이 필요합니다.`;
}

function recommendations(data) {
  const up = data.categoryRows.filter((r) => r.top100Delta > 0 || r.top500Delta > 0).slice(0, 3).map((r) => r.category);
  const down = data.categoryRows.filter((r) => r.top100Delta < 0 || r.top500Delta < 0).slice(0, 3).map((r) => r.category);
  return [
    { title: "즉시 대응 · 확대 카테고리", body: up.length ? `${up.join("·")}의 상위권 키워드와 신규 진입 소재를 중심으로 콘텐츠·상품 노출 우선순위를 점검합니다.` : "뚜렷하게 확대된 카테고리가 없어 현 포트폴리오의 효율을 우선 점검합니다." },
    { title: "리스크 관리 · 축소 카테고리", body: down.length ? `${down.join("·")}의 순위권 키워드 감소가 재고·광고 효율과 연결되는지 확인하고 단기 예산을 조정합니다.` : "뚜렷하게 축소된 카테고리가 없어 급격한 감축보다 현 수준의 추적이 적절합니다." },
    { title: "중기 관찰 · 신규 소재", body: data.newTop100.length ? `${data.newTop100.slice(0, 6).map((r) => r.keyword).join("·")}의 다음 기간 잔존 여부를 추적해 일시 이슈와 지속 트렌드를 구분합니다.` : "TOP 100 신규 소재가 제한적이므로 기존 상위 키워드의 세부 검색어 확장을 관찰합니다." },
    { title: "검증 원칙", body: "본 보고서는 검색 순위의 변화만 보여줍니다. 원인 판단과 투자 결정 전 매출, 전환율, 광고 집행, 계절 이벤트 데이터를 함께 검토합니다." }
  ];
}

function categorySentence(rows, positive) {
  if (!rows.length) return positive ? "뚜렷한 순위권 확대 카테고리가 없습니다." : "뚜렷한 순위권 축소 카테고리가 없습니다.";
  return rows.map((r) => `${r.category}(${signed(r.top500Delta)}개)`).join(", ") + " 변화가 확인됩니다.";
}

function metric(value, label, color) { return `<div class="metric ${color}"><strong>${value}</strong><span>${label}</span></div>`; }
function tone(value) { return Number(value) > 0 ? "positive" : Number(value) < 0 ? "negative" : ""; }
function signed(value) { const n = Number(value || 0); return `${n > 0 ? "+" : ""}${n}`; }
function normalize(value) { return String(value || "").trim().toLowerCase().replace(/\s+/g, ""); }
function unique(values) { return [...new Set(values)]; }
function periodLabel(report) { return `${report.startDate || ""} ~ ${report.endDate || ""}`; }
function e(value) { return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }

async function launchPdfBrowser() {
  const puppeteer = await import("puppeteer-core");
  if (process.env.VERCEL || process.env.AWS_REGION) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({ args: chromium.args, defaultViewport: chromium.defaultViewport, executablePath: await chromium.executablePath(), headless: chromium.headless });
  }
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].find((path) => existsSync(path));
  if (!executablePath) throw new Error("로컬 PDF 생성에는 CHROME_EXECUTABLE_PATH가 필요합니다.");
  return puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
}

function reportCss() {
  const fontFace = IS_SERVERLESS
    ? ""
    : `@font-face{font-family:"Noto Sans KR";font-style:normal;font-weight:100 900;src:url(data:font/ttf;base64,${KOREAN_FONT_DATA}) format("truetype")}`;
  return `${fontFace}@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Noto Sans KR",Arial,sans-serif;color:#152033;background:#fff}.page{width:210mm;height:297mm;page-break-after:always;padding:15mm 18mm 13mm;display:flex;flex-direction:column}.page:last-child{page-break-after:auto}header,footer{display:flex;justify-content:space-between;color:#7b8492;font-size:8px;letter-spacing:.5px}header{padding-bottom:4mm;border-bottom:1px solid #dce1e6}footer{margin-top:auto;padding-top:4mm;border-top:1px solid #dce1e6}main{padding-top:8mm}.section-no,.eyebrow{font-size:8px;letter-spacing:2px;color:#e66a4e;font-weight:800;text-transform:uppercase}h1{font-family:Georgia,"Noto Sans KR",serif;font-size:26px;margin:3mm 0 2mm;letter-spacing:0}h2{font-size:14px;margin:0 0 5mm}h3{font-size:11px;margin:0 0 2mm}.sub{font-size:9px;color:#6d7580;margin:0 0 5mm}.cover{padding-top:30mm}.cover header,.cover footer{display:none}.cover h1{font-size:42px;line-height:.9;margin-top:30mm}.cover h2{font-size:17px;color:#5e6672;margin-top:8mm}.cover-metrics,.metrics{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #dde2e7;margin-top:14mm}.metric{padding:5mm 3mm;text-align:center;border-right:1px solid #dde2e7}.metric:last-child{border-right:0}.metric strong{display:block;font:22px Georgia,serif}.metric span{display:block;font-size:8px;margin-top:2mm;color:#6c7480}.metric.coral strong{color:#df654c}.metric.green strong{color:#188064}.metric.gold strong{color:#b1892f}.metric.navy strong{color:#26344f}.cover-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-top:10mm;padding-top:5mm;border-top:1px solid #202b3c;font-size:8px}.cover-meta small{display:block;color:#89919b;margin-bottom:1.5mm}.lead{padding:5mm;border-left:3px solid #d9aa42;background:#faf9f5}.lead b{font-size:10px;color:#9d7927}.lead p{font-size:12px;line-height:1.75;margin:2mm 0 0}.insight-grid,.recommendations{display:grid;grid-template-columns:repeat(2,1fr);gap:5mm;margin-top:8mm}.insight-grid article,.recommendations article{padding:5mm;background:#f7f9fa;border-left:2px solid #19856c}.insight-grid p,.recommendations p,.key-insight p,.conclusion p,.method p{font-size:9px;line-height:1.65;margin:0}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:6mm}table{width:100%;border-collapse:collapse;font-size:8px}th{text-align:left;color:#616b78;border-bottom:1.5px solid #26344f;padding:2.2mm 1.5mm}td{border-bottom:1px solid #e1e5e9;padding:2.1mm 1.5mm;vertical-align:top}.positive{color:#11805f;font-weight:800}.negative{color:#d75843;font-weight:800}.key-insight{margin-top:6mm;padding:4mm;border:1px solid #df725b}.key-insight b{font-size:8px;letter-spacing:1.5px;color:#df654c}.conclusion{margin-top:10mm;padding-top:6mm;border-top:1px solid #dce1e6}.conclusion h2{font-family:Georgia,"Noto Sans KR",serif;font-size:18px}.method{margin-top:7mm;padding:4mm;background:#f5f7f8}.method b{font-size:9px}.recommendations article:nth-child(2){border-color:#df654c}.recommendations article:nth-child(3){border-color:#d2a632}.recommendations article:nth-child(4){border-color:#747c8d}`;
}

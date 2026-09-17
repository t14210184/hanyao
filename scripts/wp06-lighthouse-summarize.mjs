import fs from "node:fs";
import path from "node:path";

const reportDir = path.resolve(process.argv[2] || ".wp06-lighthouse");
const expectedPaths = [
  "/",
  "/services/ac-repair/",
  "/services/ac-cleaning/",
  "/services/ac-installation/",
  "/services/commercial-ac/",
];
const expectedRunsPerPage = Number(process.env.WP06_RUNS || 3);
const lighthouseReportName = /^(home|repair|cleaning|installation|commercial)-\d+\.json$/;

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const round = (value, digits = 0) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? null
    : Number(value.toFixed(digits));

const normalizePath = (rawUrl) => {
  const pathname = new URL(rawUrl).pathname || "/";
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
};

const auditValue = (lhr, id) => {
  const value = lhr?.audits?.[id]?.numericValue;
  return Number.isFinite(value) ? value : null;
};

const opportunityScore = (audit) => {
  const ms = audit?.details?.overallSavingsMs;
  const bytes = audit?.details?.overallSavingsBytes;
  if (Number.isFinite(ms) && ms > 0) return ms;
  if (Number.isFinite(bytes) && bytes > 0) return bytes / 1000;
  return 0;
};

if (!fs.existsSync(reportDir)) {
  throw new Error(`WP06_REPORT_DIR_NOT_FOUND:${reportDir}`);
}

const files = fs
  .readdirSync(reportDir)
  .filter((name) => lighthouseReportName.test(name))
  .sort();

const reports = files.map((name) => {
  const lhr = JSON.parse(fs.readFileSync(path.join(reportDir, name), "utf8"));
  const pagePath = normalizePath(lhr.finalDisplayedUrl || lhr.finalUrl || lhr.requestedUrl);
  return {
    name,
    pagePath,
    lhr,
    score: Number.isFinite(lhr?.categories?.performance?.score)
      ? lhr.categories.performance.score * 100
      : null,
    fcpMs: auditValue(lhr, "first-contentful-paint"),
    lcpMs: auditValue(lhr, "largest-contentful-paint"),
    speedIndexMs: auditValue(lhr, "speed-index"),
    tbtMs: auditValue(lhr, "total-blocking-time"),
    cls: auditValue(lhr, "cumulative-layout-shift"),
    ttiMs: auditValue(lhr, "interactive"),
    serverResponseMs: auditValue(lhr, "server-response-time"),
  };
});

const grouped = new Map(expectedPaths.map((pagePath) => [pagePath, []]));
for (const report of reports) {
  if (!grouped.has(report.pagePath)) {
    throw new Error(`WP06_UNEXPECTED_PAGE:${report.pagePath}:${report.name}`);
  }
  grouped.get(report.pagePath).push(report);
}

for (const [pagePath, pageReports] of grouped) {
  if (pageReports.length !== expectedRunsPerPage) {
    throw new Error(
      `WP06_RUN_COUNT_MISMATCH:${pagePath}:expected=${expectedRunsPerPage}:actual=${pageReports.length}`
    );
  }
}

const pageSummaries = [];
for (const pagePath of expectedPaths) {
  const pageReports = grouped.get(pagePath);
  const byScore = [...pageReports].sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity));
  const representative = byScore[Math.floor(byScore.length / 2)];
  const opportunities = Object.entries(representative.lhr.audits || {})
    .map(([id, audit]) => ({
      id,
      title: audit?.title || id,
      savingsMs: round(audit?.details?.overallSavingsMs ?? null),
      savingsBytes: round(audit?.details?.overallSavingsBytes ?? null),
      rank: opportunityScore(audit),
    }))
    .filter((item) => item.rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 8)
    .map(({ rank: _rank, ...item }) => item);

  const summary = {
    path: pagePath,
    runs: pageReports.length,
    median: {
      performanceScore: round(median(pageReports.map((r) => r.score)), 1),
      fcpMs: round(median(pageReports.map((r) => r.fcpMs))),
      lcpMs: round(median(pageReports.map((r) => r.lcpMs))),
      speedIndexMs: round(median(pageReports.map((r) => r.speedIndexMs))),
      tbtMs: round(median(pageReports.map((r) => r.tbtMs))),
      cls: round(median(pageReports.map((r) => r.cls)), 3),
      ttiMs: round(median(pageReports.map((r) => r.ttiMs))),
      serverResponseMs: round(median(pageReports.map((r) => r.serverResponseMs))),
    },
    gate: {
      lcpP75TargetMs: 2500,
      clsP75Target: 0.1,
      labLcpAtOrBelowTarget: false,
      labClsAtOrBelowTarget: false,
      inpMeasuredByThisLab: false,
    },
    representativeRun: representative.name,
    topOpportunities: opportunities,
  };
  summary.gate.labLcpAtOrBelowTarget =
    summary.median.lcpMs !== null && summary.median.lcpMs <= summary.gate.lcpP75TargetMs;
  summary.gate.labClsAtOrBelowTarget =
    summary.median.cls !== null && summary.median.cls <= summary.gate.clsP75Target;
  pageSummaries.push(summary);
}

const output = {
  schemaVersion: 1,
  result: "WP06_LIGHTHOUSE_MOBILE_BASELINE_COMPLETE",
  generatedAt: new Date().toISOString(),
  source: "Lighthouse 13.4.1 / GitHub-hosted Ubuntu / simulated mobile",
  caveats: [
    "Lab results are not CrUX field p75 and must not be presented as field Core Web Vitals.",
    "Lighthouse does not provide field INP here; TBT is retained as a lab responsiveness diagnostic, not an INP substitute.",
    "Each page uses the median of three independent Lighthouse mobile runs.",
  ],
  pages: pageSummaries,
};

const summaryJson = path.join(reportDir, "summary.json");
fs.writeFileSync(summaryJson, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const fmtMs = (value) => (value === null ? "n/a" : `${value} ms`);
const fmt = (value) => (value === null ? "n/a" : String(value));
const lines = [
  "# WP06 Lighthouse mobile baseline",
  "",
  `Generated: ${output.generatedAt}`,
  "",
  "Lab baseline only. These are not CrUX field p75 values; TBT is not INP.",
  "",
  "| Page | Perf | FCP | LCP | TBT | CLS | LCP <= 2.5s | CLS <= 0.1 |",
  "|---|---:|---:|---:|---:|---:|:---:|:---:|",
  ...pageSummaries.map((page) =>
    `| ${page.path} | ${fmt(page.median.performanceScore)} | ${fmtMs(page.median.fcpMs)} | ${fmtMs(page.median.lcpMs)} | ${fmtMs(page.median.tbtMs)} | ${fmt(page.median.cls)} | ${page.gate.labLcpAtOrBelowTarget ? "PASS" : "FAIL"} | ${page.gate.labClsAtOrBelowTarget ? "PASS" : "FAIL"} |`
  ),
  "",
  "## Evidence-driven opportunities",
  "",
];

for (const page of pageSummaries) {
  lines.push(`### ${page.path}`);
  if (!page.topOpportunities.length) {
    lines.push("- No Lighthouse opportunity with positive estimated savings in the representative run.");
  } else {
    for (const item of page.topOpportunities) {
      const parts = [];
      if (item.savingsMs !== null) parts.push(`${item.savingsMs} ms`);
      if (item.savingsBytes !== null) parts.push(`${item.savingsBytes} bytes`);
      lines.push(`- ${item.id}: ${item.title}${parts.length ? ` (${parts.join(", ")})` : ""}`);
    }
  }
  lines.push("");
}

fs.writeFileSync(path.join(reportDir, "summary.md"), `${lines.join("\n")}\n`, "utf8");
console.log(JSON.stringify(output, null, 2));

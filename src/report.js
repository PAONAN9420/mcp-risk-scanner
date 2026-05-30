function riskIcon(risk) {
  if (risk === "high") return "HIGH";
  if (risk === "medium") return "MED";
  if (risk === "low") return "LOW";
  return "INFO";
}

const RISK_RANK = {
  low: 1,
  medium: 2,
  high: 3
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function summarize(results) {
  const summary = {
    files: results.length,
    servers: 0,
    high: 0,
    medium: 0,
    low: 0,
    errors: 0,
    maxRisk: "low"
  };

  for (const result of results) {
    if (result.error) {
      summary.errors += 1;
      continue;
    }
    summary.servers += result.servers.length;
    for (const server of result.servers) {
      summary[server.risk] += 1;
      if (RISK_RANK[server.risk] > RISK_RANK[summary.maxRisk]) {
        summary.maxRisk = server.risk;
      }
    }
  }

  return summary;
}

export function createReport(results, scannedAt = new Date().toISOString()) {
  return {
    scannedAt,
    summary: summarize(results),
    results
  };
}

export function formatTextReport(report) {
  const { results, summary } = report;
  const lines = [];

  lines.push("mcp-audit report");
  lines.push("================");
  lines.push(`Scanned at: ${report.scannedAt}`);
  lines.push(`Files checked: ${summary.files}`);
  lines.push(`Servers found: ${summary.servers}`);
  lines.push(`Risk counts: HIGH ${summary.high}, MED ${summary.medium}, LOW ${summary.low}`);
  lines.push(`Max risk: ${summary.maxRisk.toUpperCase()}`);
  if (summary.errors > 0) lines.push(`Files with errors: ${summary.errors}`);
  lines.push("");

  for (const result of results) {
    lines.push(result.path);
    lines.push("-".repeat(Math.min(result.path.length, 72)));

    if (result.error) {
      lines.push(`ERROR ${result.error}`);
      lines.push("");
      continue;
    }

    if (result.servers.length === 0) {
      lines.push("No MCP servers found.");
      lines.push("");
      continue;
    }

    if (result.policyPath) {
      lines.push(`Policy: ${result.policyPath}`);
    }

    for (const server of result.servers) {
      lines.push(`${riskIcon(server.risk)} ${server.name} (${server.score} pts)`);
      lines.push(`  command: ${server.command || "(none)"}`);
      if (server.args.length > 0) lines.push(`  args: ${server.args.join(" ")}`);
      for (const finding of server.findings) {
        lines.push(`  - ${finding.severity.toUpperCase()}: ${finding.message}`);
      }
      if (server.recommendations.length > 0) {
        lines.push("  recommendations:");
        for (const recommendation of server.recommendations) {
          lines.push(`  - ${recommendation}`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function formatHtmlReport(report) {
  const { results, summary } = report;
  const rows = [];

  for (const result of results) {
    for (const server of result.servers) {
      const findings = server.findings
        .map((finding) => `<li><strong>${escapeHtml(finding.severity.toUpperCase())}</strong>: ${escapeHtml(finding.message)}</li>`)
        .join("");
      rows.push(`
        <tr>
          <td>${escapeHtml(server.risk.toUpperCase())}</td>
          <td>${escapeHtml(server.name)}</td>
          <td>${escapeHtml(server.command || "(none)")}</td>
          <td>${escapeHtml(server.score)}</td>
          <td><ul>${findings}</ul></td>
        </tr>
      `);
    }
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>mcp-audit report</title>
    <style>
      body { margin: 0; padding: 32px; font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17202a; background: #f6f7f9; }
      main { max-width: 1120px; margin: 0 auto; }
      h1 { margin: 0 0 8px; font-size: 30px; }
      .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
      .card { background: #fff; border: 1px solid #dfe4ea; border-radius: 8px; padding: 14px; }
      .card strong { display: block; font-size: 24px; }
      table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #dfe4ea; border-radius: 8px; overflow: hidden; }
      th, td { border-bottom: 1px solid #e6ebf0; padding: 10px; text-align: left; vertical-align: top; }
      th { background: #edf2f7; }
      ul { margin: 0; padding-left: 18px; }
      @media (max-width: 860px) { body { padding: 18px; } .summary { grid-template-columns: 1fr 1fr; } table { display: block; overflow-x: auto; } }
    </style>
  </head>
  <body>
    <main>
      <h1>mcp-audit report</h1>
      <p>Scanned at ${escapeHtml(report.scannedAt)}</p>
      <div class="summary">
        <div class="card"><strong>${summary.files}</strong><span>files</span></div>
        <div class="card"><strong>${summary.servers}</strong><span>servers</span></div>
        <div class="card"><strong>${summary.high}</strong><span>high risk</span></div>
        <div class="card"><strong>${summary.medium}</strong><span>medium risk</span></div>
        <div class="card"><strong>${escapeHtml(summary.maxRisk.toUpperCase())}</strong><span>max risk</span></div>
      </div>
      <table>
        <thead>
          <tr><th>Risk</th><th>Server</th><th>Command</th><th>Score</th><th>Findings</th></tr>
        </thead>
        <tbody>
          ${rows.join("\n") || '<tr><td colspan="5">No MCP servers found.</td></tr>'}
        </tbody>
      </table>
    </main>
  </body>
</html>`;
}

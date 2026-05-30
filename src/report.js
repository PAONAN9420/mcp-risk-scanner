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

function allServers(results) {
  return results.flatMap((result) => result.servers.map((server) => ({
    ...server,
    configPath: result.path
  })));
}

function collectFindingsBySeverity(servers, severity) {
  return servers.flatMap((server) => server.findings
    .filter((finding) => finding.severity === severity)
    .map((finding) => ({
      server: server.name,
      command: server.command || "(none)",
      message: finding.message,
      recommendation: finding.recommendation
    })));
}

function proRiskNarrative(summary) {
  if (summary.high > 0) {
    return "High-risk MCP servers were found. Review shell launchers, broad filesystem access, and package-runner usage before allowing autonomous agent workflows.";
  }
  if (summary.medium > 0) {
    return "No high-risk servers were found, but medium-risk patterns should be reviewed before expanding agent permissions.";
  }
  return "No high or medium risk servers were found in this scan. Keep policy checks in CI so future MCP changes are reviewed.";
}

function recommendedNextSteps(summary) {
  const steps = [
    "Pin package-runner based MCP servers to exact versions.",
    "Restrict filesystem MCP servers to project-specific directories.",
    "Move API keys out of MCP config files when possible.",
    "Add mcp-audit to CI with --fail-on high."
  ];

  if (summary.high === 0) {
    steps.shift();
    steps.push("Create a baseline policy file and review it monthly.");
  }

  return steps;
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

export function formatProHtmlReport(report, options = {}) {
  const { results, summary } = report;
  const servers = allServers(results).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const highFindings = collectFindingsBySeverity(servers, "high");
  const nextSteps = recommendedNextSteps(summary);
  const licenseLabel = options.license?.label || "Pro Report";
  const isDemo = options.license?.mode === "demo";

  const serverCards = servers.map((server) => {
    const findings = server.findings.map((finding) => `
      <li>
        <span class="finding-severity">${escapeHtml(finding.severity.toUpperCase())}</span>
        <span>${escapeHtml(finding.message)}</span>
      </li>
    `).join("");

    return `
      <article class="server-card risk-${escapeHtml(server.risk)}">
        <div>
          <span class="risk-pill">${escapeHtml(server.risk.toUpperCase())}</span>
          <h3>${escapeHtml(server.name)}</h3>
          <p>${escapeHtml(server.command || "(none)")}</p>
        </div>
        <strong>${escapeHtml(server.score)} pts</strong>
        <ul>${findings || "<li>No findings.</li>"}</ul>
      </article>
    `;
  }).join("");

  const highRows = highFindings.map((finding) => `
    <tr>
      <td>${escapeHtml(finding.server)}</td>
      <td>${escapeHtml(finding.command)}</td>
      <td>${escapeHtml(finding.message)}</td>
      <td>${escapeHtml(finding.recommendation || "Review this MCP server before use.")}</td>
    </tr>
  `).join("");

  const stepRows = nextSteps.map((step, index) => `<li><span>${index + 1}</span>${escapeHtml(step)}</li>`).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>mcp-audit Pro report</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #15202b; background: #f4f6f8; }
      body { margin: 0; }
      main { max-width: 1180px; margin: 0 auto; padding: 32px 22px 56px; }
      header { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr); gap: 24px; align-items: stretch; margin-bottom: 22px; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { font-size: 38px; line-height: 1.08; margin-bottom: 12px; }
      h2 { font-size: 21px; margin-bottom: 14px; }
      p { color: #506070; }
      .panel, .server-card { background: #fff; border: 1px solid #dbe2ea; border-radius: 8px; padding: 18px; }
      .hero { background: #101923; color: #fff; border-radius: 8px; padding: 26px; position: relative; overflow: hidden; }
      .hero p { color: #d6e0eb; max-width: 760px; }
      .label { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 18px; color: #9ed6b5; font-weight: 800; font-size: 13px; text-transform: uppercase; }
      .demo-watermark { position: absolute; top: 18px; right: -52px; transform: rotate(32deg); background: #f0b429; color: #251a00; padding: 8px 64px; font-weight: 900; font-size: 12px; }
      .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
      .metric { background: #fff; border: 1px solid #dbe2ea; border-radius: 8px; padding: 14px; }
      .metric strong { display: block; font-size: 28px; line-height: 1; }
      .metric span { display: block; margin-top: 6px; color: #596777; font-size: 13px; }
      .grid { display: grid; grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); gap: 16px; margin-top: 16px; }
      .next-steps { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
      .next-steps li { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: start; }
      .next-steps span { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; background: #e7f4ec; color: #17633a; font-weight: 800; }
      .servers { display: grid; gap: 12px; }
      .server-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; border-left-width: 5px; }
      .server-card h3 { margin-bottom: 4px; }
      .server-card ul { grid-column: 1 / -1; margin: 0; padding-left: 19px; }
      .risk-high { border-left-color: #d92d20; }
      .risk-medium { border-left-color: #f79009; }
      .risk-low { border-left-color: #12b76a; }
      .risk-pill { display: inline-block; border-radius: 999px; background: #edf2f7; padding: 4px 8px; font-size: 12px; font-weight: 800; margin-bottom: 8px; }
      .finding-severity { font-weight: 900; margin-right: 8px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #e3e8ef; padding: 10px; text-align: left; vertical-align: top; }
      th { color: #334155; background: #edf2f7; }
      footer { color: #64748b; margin-top: 24px; font-size: 13px; }
      @media (max-width: 880px) { main { padding: 20px 14px 36px; } header, .grid, .summary { grid-template-columns: 1fr; } h1 { font-size: 30px; } table { display: block; overflow-x: auto; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <section class="hero">
          ${isDemo ? '<div class="demo-watermark">DEMO</div>' : ""}
          <div class="label">${escapeHtml(licenseLabel)}</div>
          <h1>MCP configuration security audit</h1>
          <p>${escapeHtml(proRiskNarrative(summary))}</p>
          <p>Scanned at ${escapeHtml(report.scannedAt)} across ${summary.files} config file(s).</p>
        </section>
        <section class="panel">
          <h2>Executive summary</h2>
          <p>${escapeHtml(proRiskNarrative(summary))}</p>
          <p>Use this report to prioritize remediation before granting AI agents broader access to tools, files, credentials, and automations.</p>
        </section>
      </header>

      <section class="summary">
        <div class="metric"><strong>${summary.files}</strong><span>files scanned</span></div>
        <div class="metric"><strong>${summary.servers}</strong><span>MCP servers</span></div>
        <div class="metric"><strong>${summary.high}</strong><span>high risk</span></div>
        <div class="metric"><strong>${summary.medium}</strong><span>medium risk</span></div>
        <div class="metric"><strong>${escapeHtml(summary.maxRisk.toUpperCase())}</strong><span>max risk</span></div>
      </section>

      <div class="grid">
        <section class="panel">
          <h2>Remediation checklist</h2>
          <ol class="next-steps">${stepRows}</ol>
        </section>
        <section class="panel">
          <h2>High-risk findings</h2>
          <table>
            <thead><tr><th>Server</th><th>Command</th><th>Finding</th><th>Recommendation</th></tr></thead>
            <tbody>${highRows || '<tr><td colspan="4">No high-risk findings.</td></tr>'}</tbody>
          </table>
        </section>
      </div>

      <section class="panel" style="margin-top: 16px;">
        <h2>Server detail</h2>
        <div class="servers">${serverCards || "<p>No MCP servers found.</p>"}</div>
      </section>

      <footer>
        Generated by mcp-audit. Pro report exports are local-first and do not upload MCP configs.
      </footer>
    </main>
  </body>
</html>`;
}

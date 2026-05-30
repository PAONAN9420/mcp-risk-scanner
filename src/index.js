#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { requireProLicense } from "./license.js";
import { loadPolicy, shouldFail } from "./policy.js";
import { discoverExistingConfigPaths, scanConfigFile } from "./scanner.js";
import { createReport, formatHtmlReport, formatProHtmlReport, formatTextReport } from "./report.js";

function parseArgs(argv) {
  const args = {
    paths: [],
    format: "text",
    output: "",
    policy: "",
    failOn: "none",
    proDemo: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--path" || value === "-p") {
      const next = argv[index + 1];
      if (!next) throw new Error("--path requires a file path");
      args.paths.push(next);
      index += 1;
    } else if (value === "--json") {
      args.format = "json";
    } else if (value === "--format" || value === "-f") {
      const next = argv[index + 1];
      if (!next) throw new Error("--format requires text, json, or html");
      args.format = next;
      index += 1;
    } else if (value === "--output" || value === "-o") {
      const next = argv[index + 1];
      if (!next) throw new Error("--output requires a file path");
      args.output = next;
      index += 1;
    } else if (value === "--policy") {
      const next = argv[index + 1];
      if (!next) throw new Error("--policy requires a file path");
      args.policy = next;
      index += 1;
    } else if (value === "--fail-on") {
      const next = argv[index + 1];
      if (!next) throw new Error("--fail-on requires high, medium, low, or none");
      args.failOn = next;
      index += 1;
    } else if (value === "--pro-demo") {
      args.proDemo = true;
    } else if (value === "--help" || value === "-h") {
      args.help = true;
    } else {
      args.paths.push(value);
    }
  }

  return args;
}

function printHelp() {
  console.log(`mcp-audit

Usage:
  mcp-audit --path ./mcp.json
  mcp-audit --path ./mcp.json --json
  mcp-audit --path ./mcp.json --format html --output report.html
  mcp-audit --path ./mcp.json --format pro-html --pro-demo --output report.html
  mcp-audit --policy ./mcp-audit.policy.json --fail-on high
  mcp-audit

Options:
  -p, --path <file>       Scan a specific MCP config file. Repeatable.
  -f, --format <type>     text, json, html, or pro-html. Default: text.
  -o, --output <file>     Write the report to a file.
  --json                  Alias for --format json.
  --policy <file>         Apply a team policy file.
  --fail-on <risk>        Exit 1 when max risk is high, medium, low, or none.
  --pro-demo              Generate a watermarked pro-html sample without a license key.

When no path is provided, mcp-audit checks common Claude, Cursor, Windsurf, and local project config locations.
`);
}

function renderReport(report, format, options = {}) {
  if (format === "text") return formatTextReport(report);
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "html") return formatHtmlReport(report);
  if (format === "pro-html") {
    const license = requireProLicense({ proDemo: options.proDemo });
    return formatProHtmlReport(report, { license });
  }
  throw new Error("--format must be text, json, html, or pro-html");
}

async function writeOutput(outputPath, content) {
  const resolvedPath = path.resolve(outputPath);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content, "utf8");
  return resolvedPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const paths = args.paths.length > 0 ? args.paths : await discoverExistingConfigPaths();
  const policy = await loadPolicy(args.policy);
  const results = [];

  for (const configPath of paths) {
    const result = await scanConfigFile(configPath, { policy });
    results.push(result);
  }

  const report = createReport(results);
  const rendered = renderReport(report, args.format, { proDemo: args.proDemo });

  if (args.output) {
    const writtenPath = await writeOutput(args.output, rendered);
    console.log(`OK wrote ${writtenPath}`);
  } else {
    console.log(rendered);
  }

  if (shouldFail(report.summary, args.failOn)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});

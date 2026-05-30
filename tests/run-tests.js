import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPolicy } from "../src/policy.js";
import { createReport, formatHtmlReport, formatTextReport } from "../src/report.js";
import { scanConfigFile } from "../src/scanner.js";

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.join(currentDir, "..");
const fixturePath = path.join(currentDir, "..", "fixtures", "sample-config.json");
const policyPath = path.join(currentDir, "..", "fixtures", "policy.json");

const result = await scanConfigFile(fixturePath);

assert.equal(result.error, undefined);
assert.equal(result.servers.length, 3);

const safe = result.servers.find((server) => server.name === "safe-docs");
const fsAll = result.servers.find((server) => server.name === "filesystem-all");
const shell = result.servers.find((server) => server.name === "shell-helper");

assert.equal(safe.risk, "low");
assert.equal(fsAll.risk, "high");
assert.equal(shell.risk, "high");

const policy = await loadPolicy(policyPath);
const policyResult = await scanConfigFile(fixturePath, { policy });
const policyShell = policyResult.servers.find((server) => server.name === "shell-helper");
assert.equal(policyShell.findings.some((finding) => finding.source === "policy"), true);

const report = createReport([policyResult], "2026-05-30T00:00:00.000Z");
assert.equal(report.summary.maxRisk, "high");
assert.match(formatTextReport(report), /Max risk: HIGH/);
assert.match(formatHtmlReport(report), /mcp-audit report/);

const outputDir = path.join(projectDir, "tests", ".tmp");
const outputPath = path.join(outputDir, "report.json");
await fs.mkdir(outputDir, { recursive: true });
await execFileAsync("node", [
  "./src/index.js",
  "--path",
  "./fixtures/sample-config.json",
  "--format",
  "json",
  "--output",
  outputPath
], { cwd: projectDir });
const writtenReport = JSON.parse(await fs.readFile(outputPath, "utf8"));
assert.equal(writtenReport.summary.servers, 3);
await fs.rm(outputDir, { recursive: true, force: true });

try {
  await execFileAsync("node", [
    "./src/index.js",
    "--path",
    "./fixtures/sample-config.json",
    "--fail-on",
    "high"
  ], { cwd: projectDir });
  assert.fail("Expected --fail-on high to exit with code 1");
} catch (error) {
  assert.equal(error.code, 1);
}

console.log("PASS mcp-audit tests");

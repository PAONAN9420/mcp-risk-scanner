import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { generateKeyPairSync, sign } from "node:crypto";
import { promisify } from "node:util";
import { requireProLicense, validateProLicense } from "../src/license.js";
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

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" }
});
const testPayload = {
  product: "mcp-risk-scanner-pro",
  plan: "Test Pro",
  email: "test@example.com",
  orderId: "test-order",
  issuedAt: "2026-05-30T00:00:00.000Z",
  expiresAt: "2099-01-01T00:00:00.000Z"
};
const payloadEncoded = base64UrlEncode(JSON.stringify(testPayload));
const signatureEncoded = base64UrlEncode(sign(null, Buffer.from(payloadEncoded), privateKey));
const testLicenseKey = `mcp_pro_v1.${payloadEncoded}.${signatureEncoded}`;

assert.equal(validateProLicense({}).ok, false);
assert.equal(validateProLicense({ MCP_AUDIT_LICENSE_KEY: "bad-key" }).ok, false);
assert.equal(validateProLicense({ MCP_AUDIT_LICENSE_KEY: testLicenseKey }, { publicKey }).ok, true);
assert.equal(requireProLicense({ proDemo: true }).mode, "demo");
assert.throws(() => requireProLicense({ env: {} }), /MCP_AUDIT_LICENSE_KEY/);

const proOutputPath = path.join(outputDir, "pro-report.html");
await fs.mkdir(outputDir, { recursive: true });
await execFileAsync("node", [
  "./src/index.js",
  "--path",
  "./fixtures/sample-config.json",
  "--format",
  "pro-html",
  "--pro-demo",
  "--output",
  proOutputPath
], { cwd: projectDir });
const proReport = await fs.readFile(proOutputPath, "utf8");
assert.match(proReport, /MCP configuration security audit/);
assert.match(proReport, /DEMO/);
await fs.rm(outputDir, { recursive: true, force: true });

try {
  await execFileAsync("node", [
    "./src/index.js",
    "--path",
    "./fixtures/sample-config.json",
    "--format",
    "pro-html"
  ], { cwd: projectDir });
  assert.fail("Expected pro-html without license to fail");
} catch (error) {
  assert.equal(error.code, 1);
  assert.match(error.stderr, /MCP_AUDIT_LICENSE_KEY/);
}

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

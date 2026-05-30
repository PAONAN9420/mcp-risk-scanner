import fs from "node:fs/promises";
import path from "node:path";

const RISK_RANK = {
  low: 1,
  medium: 2,
  high: 3
};

function asList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function normalizeCommand(command) {
  if (!command) return "";
  return String(command).split(/[\\/]/).pop().toLowerCase();
}

function normalizePolicy(policy, sourcePath) {
  return {
    sourcePath,
    blockedServers: asList(policy.blockedServers),
    blockedCommands: asList(policy.blockedCommands).map((command) => command.toLowerCase()),
    allowedCommands: asList(policy.allowedCommands).map((command) => command.toLowerCase()),
    blockedEnvKeys: asList(policy.blockedEnvKeys),
    maxRisk: policy.maxRisk || null
  };
}

function addPolicyFinding(findings, message, recommendation) {
  findings.push({
    severity: "high",
    points: 8,
    message,
    recommendation,
    source: "policy"
  });
}

function riskAtLeast(risk, threshold) {
  if (!threshold) return false;
  return RISK_RANK[risk] >= RISK_RANK[threshold];
}

export async function loadPolicy(policyPath) {
  if (!policyPath) return null;

  const resolvedPath = path.resolve(policyPath);
  const content = await fs.readFile(resolvedPath, "utf8");
  const policy = JSON.parse(content);

  return normalizePolicy(policy, resolvedPath);
}

export function applyPolicy(server, policy) {
  if (!policy) return server;

  const findings = [...server.findings];
  const command = normalizeCommand(server.command);
  const envKeys = Object.keys(server.env || {});

  if (policy.blockedServers.includes(server.name)) {
    addPolicyFinding(
      findings,
      `Policy blocks server "${server.name}".`,
      "Remove this server or update the policy after review."
    );
  }

  if (policy.blockedCommands.includes(command)) {
    addPolicyFinding(
      findings,
      `Policy blocks command "${command}".`,
      "Use an approved executable or remove this MCP server."
    );
  }

  if (policy.allowedCommands.length > 0 && command && !policy.allowedCommands.includes(command)) {
    addPolicyFinding(
      findings,
      `Policy does not allow command "${command}".`,
      "Add the command to allowedCommands only after reviewing the server."
    );
  }

  if (policy.maxRisk && RISK_RANK[server.risk] > RISK_RANK[policy.maxRisk]) {
    addPolicyFinding(
      findings,
      `Policy maxRisk is "${policy.maxRisk}", but server risk is "${server.risk}".`,
      "Lower this server's permissions or raise maxRisk only after review."
    );
  }

  for (const envKey of envKeys) {
    if (policy.blockedEnvKeys.includes(envKey)) {
      addPolicyFinding(
        findings,
        `Policy blocks environment variable "${envKey}".`,
        "Move this secret out of the MCP server config."
      );
    }
  }

  const score = findings.reduce((total, finding) => total + finding.points, 0);
  const risk = score >= 8 ? "high" : score >= 4 ? "medium" : "low";
  const recommendations = [...new Set(findings.map((finding) => finding.recommendation).filter(Boolean))];

  return {
    ...server,
    score,
    risk,
    findings,
    recommendations
  };
}

export function shouldFail(summary, threshold) {
  if (!threshold || threshold === "none") return false;
  if (!RISK_RANK[threshold]) throw new Error("--fail-on must be high, medium, low, or none");
  return riskAtLeast(summary.maxRisk, threshold);
}

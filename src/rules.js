const SHELL_COMMANDS = new Set([
  "bash",
  "bash.exe",
  "cmd",
  "cmd.exe",
  "powershell",
  "powershell.exe",
  "pwsh",
  "pwsh.exe",
  "sh",
  "sh.exe",
  "zsh"
]);

const REMOTE_PACKAGE_COMMANDS = new Set([
  "bunx",
  "npm",
  "npx",
  "pnpm",
  "yarn"
]);

const SECRET_KEY_PATTERN = /(api[_-]?key|token|secret|password|credential|private[_-]?key)/i;
const URL_PATTERN = /^https?:\/\//i;
const BROAD_FS_PATTERN = /^(\/|[a-z]:\\)$/i;
const WRITE_CAPABLE_PATTERN = /(write|edit|delete|remove|shell|exec|filesystem|fs|browser|computer|git|deploy)/i;

function normalizeCommand(command) {
  if (!command) return "";
  return String(command).split(/[\\/]/).pop().toLowerCase();
}

function asStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function addFinding(findings, severity, points, message, recommendation) {
  findings.push({ severity, points, message, recommendation });
}

function looksUnpinnedPackage(args) {
  const packageArg = args.find((arg) => {
    if (arg.startsWith("-")) return false;
    if (arg.includes("/") || arg.includes("\\")) return false;
    return /[a-z0-9@_-]/i.test(arg);
  });

  if (!packageArg) return false;
  if (packageArg.includes("@latest")) return true;
  if (packageArg.startsWith("@")) {
    const lastAt = packageArg.lastIndexOf("@");
    return lastAt <= 0;
  }
  return !/@\d/.test(packageArg);
}

export function evaluateServer(server) {
  const command = normalizeCommand(server.command);
  const args = asStringList(server.args);
  const env = server.env && typeof server.env === "object" ? server.env : {};
  const findings = [];

  if (SHELL_COMMANDS.has(command)) {
    addFinding(
      findings,
      "high",
      6,
      "Server launches through a shell command.",
      "Avoid shell wrappers. Prefer a direct executable with explicit arguments."
    );
  }

  if (REMOTE_PACKAGE_COMMANDS.has(command)) {
    addFinding(
      findings,
      "medium",
      3,
      "Server is launched through a package runner.",
      "Pin package versions and review the package source before enabling it."
    );

    if (looksUnpinnedPackage(args) || args.includes("-y") || args.includes("--yes")) {
      addFinding(
        findings,
        "high",
        5,
        "Package runner appears to allow unpinned or auto-installed code.",
        "Pin exact versions and remove auto-install flags such as -y where possible."
      );
    }
  }

  for (const key of Object.keys(env)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      addFinding(
        findings,
        "medium",
        3,
        `Environment variable ${key} may contain a secret.`,
        "Move secrets to a dedicated secrets manager and avoid broad tool access."
      );
    }
  }

  for (const arg of args) {
    if (URL_PATTERN.test(arg)) {
      addFinding(
        findings,
        "medium",
        2,
        `Argument references a remote URL: ${arg}`,
        "Confirm the remote endpoint is trusted and required."
      );
    }

    if (BROAD_FS_PATTERN.test(arg) || arg === "--allow-all" || arg === "--all") {
      addFinding(
        findings,
        "high",
        5,
        `Argument suggests broad filesystem access: ${arg}`,
        "Restrict filesystem access to specific project directories."
      );
    }

    if (WRITE_CAPABLE_PATTERN.test(arg)) {
      addFinding(
        findings,
        "medium",
        2,
        `Argument suggests write, execution, or automation capability: ${arg}`,
        "Use least privilege and split read-only tools from write-capable tools."
      );
    }
  }

  if (WRITE_CAPABLE_PATTERN.test(server.name)) {
    addFinding(
      findings,
      "medium",
      2,
      "Server name suggests write, execution, or automation capability.",
      "Require explicit approval before enabling this server for autonomous agents."
    );
  }

  const score = findings.reduce((total, finding) => total + finding.points, 0);
  const risk = score >= 8 ? "high" : score >= 4 ? "medium" : "low";
  const recommendations = [...new Set(findings.map((finding) => finding.recommendation).filter(Boolean))];

  return {
    ...server,
    command: server.command || "",
    args,
    score,
    risk,
    findings,
    recommendations
  };
}

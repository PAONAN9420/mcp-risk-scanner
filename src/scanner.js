import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { applyPolicy } from "./policy.js";
import { evaluateServer } from "./rules.js";

function candidatePaths() {
  const home = os.homedir();
  const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");

  return [
    path.join(appData, "Claude", "claude_desktop_config.json"),
    path.join(appData, "Cursor", "User", "mcp.json"),
    path.join(appData, "Windsurf", "User", "mcp_config.json"),
    path.join(home, ".cursor", "mcp.json"),
    path.join(home, ".config", "claude", "mcp.json"),
    path.join(process.cwd(), ".mcp.json"),
    path.join(process.cwd(), "mcp.json"),
    path.join(process.cwd(), ".cursor", "mcp.json")
  ];
}

export function discoverConfigPaths() {
  return [...new Set(candidatePaths())];
}

export async function discoverExistingConfigPaths() {
  const existing = [];

  for (const configPath of discoverConfigPaths()) {
    try {
      await fs.access(configPath);
      existing.push(configPath);
    } catch {
      // Missing common locations are expected on a fresh machine.
    }
  }

  return existing;
}

function collectServerEntries(config) {
  if (!config || typeof config !== "object") return [];

  const blocks = [];
  if (config.mcpServers && typeof config.mcpServers === "object") blocks.push(config.mcpServers);
  if (config.servers && typeof config.servers === "object") blocks.push(config.servers);

  const entries = [];
  for (const block of blocks) {
    for (const [name, value] of Object.entries(block)) {
      if (!value || typeof value !== "object") continue;
      entries.push({
        name,
        command: value.command,
        args: Array.isArray(value.args) ? value.args : [],
        env: value.env || {},
        raw: value
      });
    }
  }

  return entries;
}

export async function scanConfigFile(configPath, options = {}) {
  const resolvedPath = path.resolve(configPath);

  try {
    const content = await fs.readFile(resolvedPath, "utf8");
    const config = JSON.parse(content);
    const servers = collectServerEntries(config)
      .map(evaluateServer)
      .map((server) => applyPolicy(server, options.policy));

    return {
      path: resolvedPath,
      exists: true,
      servers,
      policyPath: options.policy?.sourcePath || null
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        path: resolvedPath,
        exists: false,
        servers: [],
        error: "File not found"
      };
    }

    return {
      path: resolvedPath,
      exists: true,
      servers: [],
      error: error.message
    };
  }
}

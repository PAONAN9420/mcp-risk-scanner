# Launch Copy

## One-liner

`mcp-audit` scans your MCP configs for risky agent tool permissions before Claude, Cursor, or other AI agents touch your machine.

## Short Description

MCP servers are becoming the plugin layer for AI agents. That is powerful, but it also means local configs can give agents shell access, broad filesystem access, unpinned remote packages, and API keys.

`mcp-audit` is a local, dependency-free CLI that scans MCP configs and produces text, JSON, or HTML reports. It can also fail CI when risky MCP servers are found.

Install:

```bash
npx mcp-risk-scanner@latest --help
```

## Show HN Draft

Title:

```text
Show HN: mcp-audit - scan MCP configs for risky AI agent tool permissions
```

Post:

```text
I built mcp-audit, a local CLI that scans MCP configs for risky AI agent tool permissions.

It checks for things like shell launchers, broad filesystem access, unpinned npx/package-runner usage, remote URLs, suspicious secret env vars, and team policy violations.

It has no runtime dependencies, runs locally, and can output text, JSON, or HTML. There is also a GitHub Action scaffold so teams can fail PRs when high-risk MCP config changes are introduced.

The project is early. I am looking for feedback on false positives, missing MCP config locations, and additional rules that are explainable rather than noisy.
```

## Reddit Draft

```text
I made a small local CLI for auditing MCP configs before connecting them to Claude/Cursor/Windsurf-style agents.

It flags shell commands, broad filesystem paths, unpinned package runners, secret-looking env vars, and policy violations. It can also export JSON/HTML and fail CI.

Would love feedback from people using MCP servers day to day: what config locations or risky patterns should it detect next?
```

## X / Twitter Draft

```text
I built mcp-audit: a local CLI that scans MCP configs for risky AI agent tool permissions.

It flags shell access, broad filesystem paths, unpinned npx usage, secret-looking env vars, and policy violations.

Local-first, no runtime deps, JSON/HTML reports, CI fail-on-risk.
```

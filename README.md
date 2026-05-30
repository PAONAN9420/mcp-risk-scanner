# mcp-audit

Local MCP configuration risk scanner for Claude Desktop, Cursor, Windsurf, and other AI agent tools.

`mcp-audit` scans MCP configs for risky agent tool permissions before Claude, Cursor, or other AI agents touch your machine. It is local-first, dependency-free, and designed to fit both a developer laptop and CI.

Landing page: https://paonan9420.github.io/mcp-risk-scanner/

## Why

MCP servers are becoming the plugin layer for AI agents. That also means they can read local files, call remote services, run commands, auto-install packages, and expose secrets if configured carelessly.

`mcp-audit` gives developers a fast sanity check:

- Which MCP servers can launch shells?
- Which ones touch broad filesystem paths?
- Which ones auto-install unpinned packages?
- Which configs expose API keys or tokens?
- Which servers violate your team policy?

## Install

After npm publish:

```bash
npx mcp-risk-scanner@latest --help
npx mcp-risk-scanner@latest --path ./mcp.json
```

For local development:

```bash
npm install
npm run demo
```

## Quick start

Scan a specific MCP config:

```bash
node src/index.js --path ./fixtures/sample-config.json
```

Export JSON:

```bash
node src/index.js --path ./fixtures/sample-config.json --format json --output ./reports/mcp-audit.json
```

Export HTML:

```bash
node src/index.js --path ./fixtures/sample-config.json --format html --output ./reports/mcp-audit.html
```

Export a watermarked Pro report sample:

```bash
node src/index.js --path ./fixtures/sample-config.json --format pro-html --pro-demo --output ./reports/pro-demo-report.html
```

Fail CI when a high-risk server is found:

```bash
node src/index.js --path ./fixtures/sample-config.json --fail-on high
```

Apply a policy file:

```bash
node src/index.js --path ./fixtures/sample-config.json --policy ./fixtures/policy.json
```

When no `--path` is provided, `mcp-audit` scans existing common locations for Claude Desktop, Cursor, Windsurf, and local project MCP configs.

## Example output

```text
mcp-audit report
================
Files checked: 1
Servers found: 3
Risk counts: HIGH 2, MED 0, LOW 1
Max risk: HIGH

HIGH filesystem-all (17 pts)
  command: npx
  args: -y @modelcontextprotocol/server-filesystem C:\
  - HIGH: Package runner appears to allow unpinned or auto-installed code.
  - HIGH: Argument suggests broad filesystem access: C:\
```

## CLI options

```text
-p, --path <file>       Scan a specific MCP config file. Repeatable.
-f, --format <type>     text, json, html, or pro-html. Default: text.
-o, --output <file>     Write the report to a file.
--json                  Alias for --format json.
--policy <file>         Apply a team policy file.
--fail-on <risk>        Exit 1 when max risk is high, medium, low, or none.
--pro-demo              Generate a watermarked pro-html sample without a license key.
```

## Current checks

- shell execution commands such as `powershell`, `cmd`, `bash`, and `sh`
- unpinned remote packages launched via `npx`, `npm`, `pnpm`, `yarn`, or `bunx`
- suspicious env var names such as `TOKEN`, `SECRET`, `PASSWORD`, `API_KEY`
- broad filesystem access hints
- remote URL arguments
- write-capable or execution-capable server names and arguments
- team policy violations

## Policy file

Create `mcp-audit.policy.json`:

```json
{
  "blockedServers": ["shell-helper"],
  "blockedCommands": ["powershell.exe", "cmd.exe", "bash", "sh"],
  "allowedCommands": [],
  "blockedEnvKeys": ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"],
  "maxRisk": "medium"
}
```

`allowedCommands` is optional. When it is empty, `mcp-audit` only applies the block lists. When it contains values, every MCP server command must be in the allow list.

## GitHub Action

Example workflow:

```yaml
name: mcp-audit

on:
  pull_request:
  push:
    branches: [main]

jobs:
  audit-mcp-config:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/mcp-audit@v0
        with:
          path: .mcp.json
          policy: mcp-audit.policy.json
          fail-on: high
          output: mcp-audit-report.json
```

## Development

```bash
npm test
npm run check
npm run demo:pro
```

The project has no runtime dependencies and requires Node.js 20 or newer.

## Commercial validation

The static landing page lives in `site/index.html`. It positions the free CLI as the acquisition layer and Pro reports / team audits as paid offers.

Initial paid offers:

- `$49` one-time Pro report license.
- `$199+` one-time MCP config security audit.
- future subscription for team policy monitoring and report history.

Paid-license operations are documented in [docs/PAID_LICENSES.md](./docs/PAID_LICENSES.md).

## Package name

The npm package name is `mcp-risk-scanner`. The CLI command is available as both `mcp-audit` and `mcp-risk-scanner`.

## Security

Please do not open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md).

## License

MIT

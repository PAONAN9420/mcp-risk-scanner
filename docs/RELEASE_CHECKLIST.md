# Release Checklist

Use this before the first public release.

## Local Checks

```bash
npm test
npm run demo
npm run demo:json
npm run demo:html
npm run demo:pro
npm run check
```

## Package Checks

```bash
npm view mcp-risk-scanner
npm pack --dry-run
```

If `npm view mcp-risk-scanner` returns a 404, the package name is likely available.

## GitHub Setup

- Create the repository.
- Push the initial commit.
- Enable issues.
- Enable GitHub Actions.
- Add repository description:

```text
Local MCP configuration risk scanner for Claude, Cursor, Windsurf, and AI agent tools.
```

- Add topics:

```text
mcp, ai-agents, security, cli, claude, cursor, windsurf
```

## npm Publish

```bash
npm login
npm publish --access public
```

After publishing:

```bash
npx mcp-risk-scanner@latest --help
npx mcp-risk-scanner@latest --path ./fixtures/sample-config.json
```

## First Feedback Loop

- Ask 5 to 10 AI-agent-heavy developers to run it locally.
- Collect false positives and missing MCP config locations.
- Add rules only when the finding is explainable.
- Cut `0.1.1` quickly if install or discovery issues appear.

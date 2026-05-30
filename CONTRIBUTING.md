# Contributing

Thanks for helping improve `mcp-audit`.

## Development

```bash
npm install
npm test
npm run demo
```

## Pull Requests

Please keep pull requests focused. Good PRs usually do one of these:

- add a new risk rule
- improve report formatting
- add a parser for another MCP config shape
- improve docs or examples
- fix a false positive or false negative

Before opening a PR:

```bash
npm run check
```

## Rule Guidelines

Risk rules should be conservative and explainable.

Each finding should include:

- severity: `low`, `medium`, or `high`
- clear message
- concrete recommendation
- test fixture when practical

Avoid rules that require uploading user configs to a remote service.

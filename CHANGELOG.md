# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning.

## 0.1.0 - 2026-05-30

Initial public MVP.

### Added

- Local MCP config scanning.
- Common config discovery for Claude Desktop, Cursor, Windsurf, and local project files.
- Risk checks for shell launchers, broad filesystem access, remote package runners, remote URLs, suspicious secret env vars, and write-capable server names.
- Text, JSON, and HTML reports.
- `--output` report export.
- `--policy` team policy support.
- `--fail-on` CI exit threshold.
- GitHub Action scaffold.
- Example configs and policy file.

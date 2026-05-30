# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning.

## 0.3.0 - 2026-05-30

Paid license workflow release.

### Added

- Signed Pro license key validation.
- Public-key verification for local Pro report unlocks.
- Local license keypair initialization script.
- Manual license generation script for Gumroad / Lemon Squeezy fulfillment.
- Paid license operations guide.

## 0.2.0 - 2026-05-30

Commercial validation release.

### Added

- `pro-html` report format.
- `--pro-demo` mode for watermarked Pro report previews.
- Local `MCP_AUDIT_LICENSE_KEY` license gate skeleton.
- Static landing page in `site/`.
- GitHub Pages deployment workflow.

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

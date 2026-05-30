# Security Policy

`mcp-audit` is a local scanner for MCP configuration risk. It is not a sandbox, permission system, malware scanner, or formal security boundary.

## Supported Versions

Security fixes are currently provided for the latest released version.

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a Vulnerability

Please do not open a public GitHub issue for vulnerabilities.

Until a dedicated security contact is published, report privately to the project maintainer through the repository owner's preferred contact channel.

Please include:

- affected version or commit
- operating system
- MCP config sample with secrets removed
- expected behavior
- actual behavior
- any proof of concept required to reproduce

## Scope

In scope:

- incorrect risk classification that hides a clearly dangerous MCP config
- report output that leaks secrets beyond what is already present in the input config
- CI behavior that fails open when `--fail-on` should fail

Out of scope:

- risky MCP servers that `mcp-audit` correctly reports
- vulnerabilities in third-party MCP servers
- issues requiring malware or destructive payloads
- denial-of-service reports against local-only usage

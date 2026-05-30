# Paid License Operations

This document describes the first manual paid-license workflow for `mcp-risk-scanner`.

## Offer

Initial paid product:

```text
MCP Risk Scanner Pro Report
$49 one-time
```

Buyer receives:

- a Pro license key
- CLI command examples
- local-only Pro HTML report export
- no hosted account required

## Generate the signing keypair

Run once:

```bash
npm run license:init
```

This creates:

```text
private/license-private-key.pem
keys/public-key.pem
```

`private/` is ignored by git. Back it up securely. If the private key is lost, existing paid license keys cannot be reproduced or rotated cleanly.

## Generate a customer license

```bash
npm run license:generate -- --email customer@example.com --plan "Pro Report" --order-id gumroad-123 --expires-at 2027-05-30T00:00:00.000Z
```

For a lifetime license, omit `--expires-at`:

```bash
npm run license:generate -- --email customer@example.com --plan "Lifetime Pro Report" --order-id gumroad-123
```

Send the generated key to the buyer.

## Customer usage

PowerShell:

```powershell
$env:MCP_AUDIT_LICENSE_KEY="mcp_pro_v1..."
npx mcp-risk-scanner@latest --path .\mcp.json --format pro-html --output .\mcp-risk-report.html
```

macOS / Linux:

```bash
export MCP_AUDIT_LICENSE_KEY="mcp_pro_v1..."
npx mcp-risk-scanner@latest --path ./mcp.json --format pro-html --output ./mcp-risk-report.html
```

## Gumroad setup

Use a digital product:

```text
Name: MCP Risk Scanner Pro Report
Price: $49
Delivery: license key + instructions
```

Until automated webhooks are added, generate keys manually after purchase and email the buyer.

## Later automation

Add a small fulfillment service:

1. Receive Gumroad or Lemon Squeezy webhook.
2. Verify purchase signature.
3. Generate a signed license key.
4. Email the buyer.
5. Store order id, email hash, plan, and issued license fingerprint.

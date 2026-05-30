# Sales Operations

This is the operating playbook for selling `mcp-risk-scanner` to international developers, AI agencies, and small teams.

## Product ladder

Start with one paid offer and one service offer:

```text
MCP Risk Scanner Pro Report
$39 one-time
Signed offline license key for no-watermark Pro HTML reports.
```

```text
MCP Config Agency Audit
$199+ one-time
Manual config review, policy setup, and a client-ready remediation report.
```

Do not start with a subscription until there is recurring value, such as hosted scan history, constantly updated rule packs, team dashboards, or scheduled repository monitoring.

## Gumroad setup

Recommended first checkout because it is fast to launch.

Product fields:

```text
Name: MCP Risk Scanner Pro Report
Permalink: mcp-risk-scanner-pro
Price: $39
Product type: Digital product
Summary: Generate client-ready MCP security reports from local Claude, Cursor, Windsurf, and project configs.
```

Description:

```text
MCP Risk Scanner Pro helps developers and AI agencies audit MCP configs before agents get access to shells, local files, package runners, and secret-looking environment variables.

The free CLI scans locally. This Pro license unlocks no-watermark HTML reports designed for client delivery and internal security reviews.

You get:
- Signed Pro license key
- No-watermark Pro HTML report export
- Commercial usage for client work
- CLI examples for Windows, macOS, and Linux
- Free updates for the 0.x line

Your MCP configs stay local. No account or hosted upload is required.
```

Post-purchase instructions:

```text
Thanks for buying MCP Risk Scanner Pro.

Your license key will be sent after purchase fulfillment.

Install / run:

npx mcp-risk-scanner@latest --help

Windows PowerShell:

$env:MCP_AUDIT_LICENSE_KEY="YOUR_LICENSE_KEY"
npx mcp-risk-scanner@latest --path .\mcp.json --format pro-html --output .\mcp-risk-report.html

macOS / Linux:

export MCP_AUDIT_LICENSE_KEY="YOUR_LICENSE_KEY"
npx mcp-risk-scanner@latest --path ./mcp.json --format pro-html --output ./mcp-risk-report.html

Support:
Open a GitHub issue and include your npm version, Node version, and sanitized command output. Do not paste secrets or private MCP configs.
```

After the product is live, replace the Pro button URL in `site/index.html` with the Gumroad checkout URL:

```text
https://gumroad.com/l/mcp-risk-scanner-pro
```

## Lemon Squeezy setup

Use Lemon Squeezy if you want merchant-of-record handling, subscription lifecycle support, and built-in license-key features.

Store/product fields:

```text
Product name: MCP Risk Scanner Pro Report
Variant: Lifetime Pro
Price: $39 one-time
License keys: enabled
```

For a later subscription:

```text
Product name: MCP Risk Scanner Team
Variant: Team Monthly
Price: $9/month or $79/year
License keys: enabled
```

For subscriptions, issue expiring license keys and renew them through webhook automation later.

## Manual fulfillment

When a buyer pays, generate a signed license:

```bash
npm run license:generate -- --email customer@example.com --plan "Lifetime Pro Report" --order-id gumroad-sale-id
```

Send the generated key using this email:

```text
Subject: Your MCP Risk Scanner Pro license

Hi,

Thanks for buying MCP Risk Scanner Pro.

Your license key:

YOUR_LICENSE_KEY

Windows PowerShell:

$env:MCP_AUDIT_LICENSE_KEY="YOUR_LICENSE_KEY"
npx mcp-risk-scanner@latest --path .\mcp.json --format pro-html --output .\mcp-risk-report.html

macOS / Linux:

export MCP_AUDIT_LICENSE_KEY="YOUR_LICENSE_KEY"
npx mcp-risk-scanner@latest --path ./mcp.json --format pro-html --output ./mcp-risk-report.html

The report is generated locally. You do not need to upload MCP configs anywhere.

If something fails, reply with your Node version, npm version, and sanitized command output.
```

Store sales records in a private spreadsheet:

```text
date
platform
order_id
customer_email
plan
license_fingerprint
price
refund_status
support_notes
```

Do not store full license keys in a shared document. Store the order id and the first/last 8 characters only.

## Website checkout status

Current public page status:

```text
site/index.html Pro button -> GitHub issue license request
```

Change it to the checkout URL after Gumroad or Lemon Squeezy is live.

Search for:

```text
Request license
```

Replace the `href` with the checkout URL and change the button label to:

```text
Buy Pro - $39
```

## Subscription path

Only add subscription after the one-time offer gets demand.

Good subscription value:

- monthly rule-pack updates for new MCP server risk patterns
- GitHub repository scheduled scans
- hosted report history
- team policies and shared baselines
- Slack/email alerts for risky config changes
- priority support for AI agencies

Possible pricing:

```text
Solo Pro: $9/month or $79/year
Agency: $19/month or $149/year
Team: $49/month for 5 seats
```

## Launch copy

Short positioning:

```text
MCP Risk Scanner audits Claude, Cursor, Windsurf, and project MCP configs before agents get access to shells, local files, package runners, and secret-looking environment variables.
```

Paid pitch:

```text
The free CLI finds risky MCP configs. Pro turns the scan into a no-watermark HTML report you can send to a client or security-minded team.
```

First outreach targets:

- Indie Hackers
- Product Hunt
- Hacker News Show HN
- Reddit: r/mcp, r/ClaudeAI, r/Cursor, r/SaaS, r/LocalLLaMA
- X posts from MCP server authors and AI agency founders
- GitHub issues/discussions where users ask about MCP security

## Validation metrics

Track weekly:

```text
npm downloads
GitHub stars
Pro license requests
Checkout visits
Paid conversions
Refunds
Support requests
False-positive reports
```

The first serious milestone is not traffic. It is 3 paid licenses or 1 agency audit request from a user who is not a friend.

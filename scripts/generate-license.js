import fs from "node:fs";
import path from "node:path";
import { sign } from "node:crypto";
import { fileURLToPath } from "node:url";

const LICENSE_PREFIX = "mcp_pro_v1";
const PRODUCT_ID = "mcp-risk-scanner-pro";
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultPrivateKeyPath = path.join(rootDir, "private", "license-private-key.pem");

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function parseArgs(argv) {
  const args = {
    email: "",
    plan: "Pro",
    orderId: "",
    expiresAt: "",
    seats: 1
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--email") {
      args.email = argv[++index] || "";
    } else if (value === "--plan") {
      args.plan = argv[++index] || "Pro";
    } else if (value === "--order-id") {
      args.orderId = argv[++index] || "";
    } else if (value === "--expires-at") {
      args.expiresAt = argv[++index] || "";
    } else if (value === "--seats") {
      args.seats = Number(argv[++index] || 1);
    }
  }

  return args;
}

function readPrivateKey() {
  if (process.env.MCP_AUDIT_LICENSE_PRIVATE_KEY) {
    return process.env.MCP_AUDIT_LICENSE_PRIVATE_KEY.replaceAll("\\n", "\n");
  }

  return fs.readFileSync(defaultPrivateKeyPath, "utf8");
}

const args = parseArgs(process.argv.slice(2));
if (!args.email) {
  throw new Error("--email is required");
}

const payload = {
  product: PRODUCT_ID,
  plan: args.plan,
  email: args.email,
  orderId: args.orderId || `manual-${Date.now()}`,
  seats: args.seats,
  issuedAt: new Date().toISOString(),
  expiresAt: args.expiresAt || null
};

const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
const signatureEncoded = base64UrlEncode(sign(null, Buffer.from(payloadEncoded), readPrivateKey()));
const licenseKey = `${LICENSE_PREFIX}.${payloadEncoded}.${signatureEncoded}`;

console.log(licenseKey);

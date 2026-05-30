import fs from "node:fs";
import path from "node:path";
import { verify } from "node:crypto";
import { fileURLToPath } from "node:url";

const LICENSE_PREFIX = "mcp_pro_v1";
const PRODUCT_ID = "mcp-risk-scanner-pro";
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicKeyPath = path.join(currentDir, "..", "keys", "public-key.pem");

function base64UrlDecode(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function maskLicenseKey(key) {
  if (!key || key.length < 16) return "(invalid)";
  return `${key.slice(0, 12)}...${key.slice(-8)}`;
}

function readPublicKey() {
  return fs.readFileSync(publicKeyPath, "utf8");
}

function parseLicenseKey(key) {
  const parts = String(key || "").trim().split(".");
  if (parts.length !== 3 || parts[0] !== LICENSE_PREFIX) {
    throw new Error(`License key must start with ${LICENSE_PREFIX}.`);
  }

  const [, payloadEncoded, signatureEncoded] = parts;
  const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8"));
  const signature = base64UrlDecode(signatureEncoded);

  return {
    payload,
    payloadEncoded,
    signature
  };
}

export function validateProLicense(env = process.env, options = {}) {
  const key = env.MCP_AUDIT_LICENSE_KEY || "";

  if (!key) {
    return {
      ok: false,
      reason: "MCP_AUDIT_LICENSE_KEY is required for pro-html reports."
    };
  }

  try {
    const parsed = parseLicenseKey(key);
    const publicKey = options.publicKey || readPublicKey();
    const signatureOk = verify(null, Buffer.from(parsed.payloadEncoded), publicKey, parsed.signature);

    if (!signatureOk) {
      return {
        ok: false,
        reason: "License signature is invalid."
      };
    }

    if (parsed.payload.product !== PRODUCT_ID) {
      return {
        ok: false,
        reason: "License product does not match mcp-risk-scanner Pro."
      };
    }

    if (parsed.payload.expiresAt && new Date(parsed.payload.expiresAt) < new Date()) {
      return {
        ok: false,
        reason: "License has expired."
      };
    }

    return {
      ok: true,
      licenseKey: maskLicenseKey(key),
      payload: parsed.payload
    };
  } catch (error) {
    return {
      ok: false,
      reason: error.message
    };
  }
}

export function requireProLicense(options = {}) {
  if (options.proDemo) {
    return {
      mode: "demo",
      label: "Demo Pro Report"
    };
  }

  const result = validateProLicense(options.env);
  if (!result.ok) {
    throw new Error(`${result.reason} Use --pro-demo to generate a watermarked sample report.`);
  }

  const plan = result.payload.plan || "Pro";
  return {
    mode: "licensed",
    payload: result.payload,
    label: `${plan} Report (${result.licenseKey})`
  };
}

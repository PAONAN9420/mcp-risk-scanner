export function validateProLicense(env = process.env) {
  const key = env.MCP_AUDIT_LICENSE_KEY || "";

  if (!key) {
    return {
      ok: false,
      reason: "MCP_AUDIT_LICENSE_KEY is required for pro-html reports."
    };
  }

  if (key.length < 12) {
    return {
      ok: false,
      reason: "MCP_AUDIT_LICENSE_KEY is too short."
    };
  }

  return {
    ok: true,
    licenseKey: key.slice(0, 4) + "..." + key.slice(-4)
  };
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

  return {
    mode: "licensed",
    label: `Licensed Pro Report (${result.licenseKey})`
  };
}

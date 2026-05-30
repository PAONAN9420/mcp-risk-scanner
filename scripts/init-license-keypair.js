import fs from "node:fs";
import path from "node:path";
import { generateKeyPairSync } from "node:crypto";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const privateDir = path.join(rootDir, "private");
const keysDir = path.join(rootDir, "keys");
const privateKeyPath = path.join(privateDir, "license-private-key.pem");
const publicKeyPath = path.join(keysDir, "public-key.pem");

if (fs.existsSync(privateKeyPath) || fs.existsSync(publicKeyPath)) {
  throw new Error("License keypair already exists. Remove existing files before generating a new keypair.");
}

const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem"
  },
  publicKeyEncoding: {
    type: "spki",
    format: "pem"
  }
});

fs.mkdirSync(privateDir, { recursive: true });
fs.mkdirSync(keysDir, { recursive: true });
fs.writeFileSync(privateKeyPath, privateKey, { encoding: "utf8", mode: 0o600 });
fs.writeFileSync(publicKeyPath, publicKey, "utf8");

console.log(`OK wrote private key to ${privateKeyPath}`);
console.log(`OK wrote public key to ${publicKeyPath}`);
console.log("WARN private/ is gitignored. Back up the private key securely.");

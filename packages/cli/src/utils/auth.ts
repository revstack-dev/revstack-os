import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CREDENTIALS_DIR = path.join(os.homedir(), ".revstack");
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, "credentials.json");

interface Credentials {
  apiKey: string;
}

/**
 * Persist an API key to the global credentials file.
 * Creates `~/.revstack/` if it doesn't exist.
 */
export function setApiKey(key: string): void {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true });
  }

  const credentials: Credentials = { apiKey: key };
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(credentials, null, 2),
    "utf-8",
  );
}

/**
 * Read the stored API key, or return `null` if none is configured.
 */
export function getApiKey(): string | null {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
    const credentials: Credentials = JSON.parse(raw);
    return credentials.apiKey ?? null;
  } catch {
    return null;
  }
}

/**
 * Remove stored credentials. Used by `revstack logout`.
 */
export function clearApiKey(): void {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

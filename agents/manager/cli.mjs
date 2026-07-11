import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runManagerAgent } from "./manager-agent.mjs";

const DEFAULT_REQUEST = "Create a weekly client summary draft and identify approval needs.";

function loadLocalEnv() {
  const envPath = resolve(import.meta.dirname, "..", "..", ".env.local");
  try {
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // The CLI can still run in dry-run mode without local secrets.
  }
}

function parseArgs(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const request = argv.filter((arg) => !arg.startsWith("--")).join(" ").trim() || DEFAULT_REQUEST;

  return {
    dryRun: flags.has("--dry-run"),
    json: flags.has("--json"),
    request,
  };
}

async function main() {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));
  const result = await runManagerAgent(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`AiMS Manager Agent (${result.mode})`);
  console.log(`Request: ${result.request}`);
  console.log(result.outputText ?? JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

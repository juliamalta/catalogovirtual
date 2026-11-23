import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateTestDatabaseEnvironment } from "./lib/test-database-safety.mjs";

// Deliberately never loads .env.local, .vercel or the production environment.
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");
try {
  if (!validateTestDatabaseEnvironment(process.env)) throw new Error("Explicit authorization and complete isolated configuration required.");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "src/server/multi-tenant.integration.test.ts"], { env: process.env, stdio: "inherit", windowsHide: true });
process.exit(result.status ?? 1);

import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const directUrl = process.env.DATABASE_URL_UNPOOLED;
const requestedCommand = process.argv.find((argument) => ["generate", "migrate", "push"].includes(argument));

if (requestedCommand === "push") {
  throw new Error("drizzle-kit push is disabled; use a reviewed migration instead.");
}

if (requestedCommand === "migrate" && !directUrl) {
  throw new Error("DATABASE_URL_UNPOOLED is required for migrations. No database connection was attempted.");
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Generation does not connect. Migration commands require the unpooled URL above.
    url: directUrl || "postgresql://localhost:5432/drizzle_generation_only"
  },
  strict: true,
  verbose: true
});

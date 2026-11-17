import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | undefined;
let pool: Pool | undefined;

function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não está configurada. Copie .env.example para .env.local e informe sua conexão Neon.");
  pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
  return drizzle({ client: pool, schema });
}

export function getDb() {
  database ??= createDatabase();
  return database;
}

export async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
    database = undefined;
  }
}

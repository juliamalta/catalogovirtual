// No connections or writes here. Control-plane evidence must be reviewed separately.
export function validateTestDatabaseEnvironment(env) {
  if (env.RUN_TENANT_INTEGRATION_TESTS !== "YES") return null;
  const fail = () => { throw new Error("Isolated PostgreSQL configuration is incomplete or unsafe; no fixtures were written. Review docs/phase-7-3-postgresql-rls.md. Credentials suppressed."); };
  const name = env.TEST_DATABASE_NAME;
  if (!name || !/^[a-z][a-z0-9_]*_test$/.test(name) || !env.TEST_DATABASE_URL) fail();
  let target;
  try { target = new URL(env.TEST_DATABASE_URL); } catch { fail(); }
  if (!["postgres:", "postgresql:"].includes(target.protocol)) fail();
  let database;
  try { database = decodeURIComponent(target.pathname.slice(1)); } catch { fail(); }
  const endpoint = target.hostname.replace(/-pooler(?=\.)/, "");
  if (database !== name || !target.username || !target.password || target.hostname.includes("-pooler.")) fail();
  if (!["require", "verify-full"].includes(target.searchParams.get("sslmode"))) fail();
  // Different endpoint AND database: a new name on the main endpoint is insufficient.
  if (env.DATABASE_URL) {
    let primary;
    try { primary = new URL(env.DATABASE_URL); } catch { fail(); }
    if (endpoint === primary.hostname.replace(/-pooler(?=\.)/, "")) fail();
  }
  if (!env.TEST_DATABASE_ENDPOINT || endpoint !== env.TEST_DATABASE_ENDPOINT) fail();
  if (!/^br-[a-z0-9-]+$/.test(env.TEST_NEON_BRANCH_ID ?? "") || !/^br-[a-z0-9-]+$/.test(env.PRIMARY_NEON_BRANCH_ID ?? "")) fail();
  if (env.TEST_NEON_BRANCH_ID === env.PRIMARY_NEON_BRANCH_ID || env.TEST_DATABASE_APPROVAL !== "ISOLATED_BRANCH_WRITES_AUTHORIZED") fail();
  return { connectionString: env.TEST_DATABASE_URL, databaseName: name, endpoint };
}

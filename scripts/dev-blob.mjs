import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { list } from "@vercel/blob";

// Invoke through `npm run dev:blob`: Vercel injects Development credentials
// and OIDC into the child process. Never persist them or use Production.
try {
  const project = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
  if (project.projectName !== "catalogovirtual") throw new Error("Wrong local project");
  if (!process.env.BLOB_STORE_ID || !process.env.BLOB_WEBHOOK_PUBLIC_KEY || !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error("Development OIDC configuration missing");
  }
  // Only the public origin is saved locally. Tokens always come from Vercel.
  const callbackFile = resolve(".vercel/blob-callback.json");
  const callbackOrigin = process.env.VERCEL_BLOB_CALLBACK_URL ||
    (existsSync(callbackFile) ? JSON.parse(readFileSync(callbackFile, "utf8")).origin : null);
  if (callbackOrigin) {
    const url = new URL(callbackOrigin);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      throw new Error("Invalid development callback origin");
    }
    const health = await fetch(new URL("/_blob-callback-health", url), { signal: AbortSignal.timeout(15000), redirect: "error" });
    if (!health.ok || (await health.json()).service !== "blob-callback-relay") {
      throw new Error("Development callback relay unavailable");
    }
    process.env.VERCEL_BLOB_CALLBACK_URL = url.origin;
    console.log("Callback HTTPS de produtos validado; painel e autenticação não são expostos pelo relay.");
  } else {
    console.warn("Fotos de produtos exigem configurar um callback HTTPS em .vercel/blob-callback.json. O upload de Aparência continua disponível.");
  }
  // Verify access before starting Next; no objects are written.
  await list({ limit: 1 });
} catch {
  console.error("Não foi possível validar o Blob em Development. Confira o vínculo Vercel e execute npm run dev:blob. Credenciais omitidas.");
  process.exit(1);
}

process.env.NEXT_TELEMETRY_DISABLED = "1";
console.log("Iniciando Catálogo na porta 3002 com Blob/OIDC de Development. Aparência não requer callback HTTPS.");
const child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "dev", "--port", "3002"], {
  env: process.env, stdio: "inherit", windowsHide: true
});
child.on("error", () => { console.error("Não foi possível iniciar o servidor local."); process.exitCode = 1; });
child.on("exit", code => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));

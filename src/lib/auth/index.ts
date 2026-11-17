import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { authAdapterSchema } from "@/lib/db/schema/auth.schema";
import { getDb } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";

function requiredEnvironmentValue(name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não está configurada no servidor.`);
  return value;
}

function createAuth() {
  const secret = requiredEnvironmentValue("BETTER_AUTH_SECRET");
  const baseURL = requiredEnvironmentValue("BETTER_AUTH_URL");
  if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET deve ter pelo menos 32 caracteres.");

  const trustedOrigins = [baseURL];
  if (process.env.NODE_ENV === "development") {
    trustedOrigins.push("http://localhost:*", "http://127.0.0.1:*");
  }

  return betterAuth({
    appName: "Catálogo Loja Virtual",
    baseURL,
    secret,
    trustedOrigins,
    database: drizzleAdapter(getDb(), { provider: "pg", schema: authAdapterSchema, transaction: true }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => sendPasswordResetEmail({ email: user.email, name: user.name, url })
    }
  });
}

type AuthInstance = ReturnType<typeof createAuth>;
let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  authInstance ??= createAuth();
  return authInstance;
}

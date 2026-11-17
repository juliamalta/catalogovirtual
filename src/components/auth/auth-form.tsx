"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { emailSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validations/auth";

export type AuthFormMode = "login" | "register" | "forgot" | "reset";

function PasswordField({ name, label, autoComplete, error }: { name: string; label: string; autoComplete: string; error: boolean }) {
  const [visible, setVisible] = useState(false);
  const id = `auth-${name}`;

  return (
    <label className="grid gap-2 text-sm font-medium text-[#34313a]" htmlFor={id}>
      <span>{label}</span>
      <span className="relative block">
        <input className="h-12 w-full rounded-lg border border-[#dedbe4] bg-white px-3.5 pr-12 text-[15px] outline-none transition focus:border-[#7351d6] focus:ring-4 focus:ring-[#7351d6]/10" id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={8} maxLength={128} aria-invalid={error} />
        <button className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-[#77717e] hover:bg-[#f4f1fa] hover:text-[#7351d6]" type="button" aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} onClick={() => setVisible((value) => !value)}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

function readableError(cause: unknown) {
  if (cause instanceof TypeError || (cause instanceof Error && /fetch|network|conexÃ£o/i.test(cause.message))) {
    return "NÃ£o foi possÃ­vel conectar agora. Verifique sua conexÃ£o e tente novamente.";
  }
  if (cause instanceof Error && /invalid.*credential|incorrect.*password|email or password|unauthorized/i.test(cause.message)) {
    return "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
  }
  return cause instanceof Error && cause.message ? cause.message : "NÃ£o foi possÃ­vel concluir. Tente novamente.";
}

export function AuthForm({ mode }: { mode: AuthFormMode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");

    try {
      if (mode === "login") {
        const parsed = signInSchema.safeParse({ email, password: form.get("password") });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Confira seus dados.");
        const result = await authClient.signIn.email({ ...parsed.data, callbackURL: "/painel" });
        if (result.error) throw new Error(result.error.message || "E-mail ou senha incorretos.");
        router.replace("/painel");
        router.refresh();
      } else if (mode === "register") {
        const parsed = signUpSchema.safeParse({ name: form.get("name"), email, password: form.get("password") });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Confira seus dados.");
        if (parsed.data.password !== form.get("confirmPassword")) throw new Error("As senhas nÃ£o coincidem.");
        const result = await authClient.signUp.email({ ...parsed.data, callbackURL: "/painel" });
        if (result.error) throw new Error(result.error.message || "NÃ£o foi possÃ­vel criar sua conta.");
        setMessage("Conta criada. Estamos abrindo seu painelâ€¦");
        router.replace("/painel");
        router.refresh();
      } else if (mode === "forgot") {
        const parsed = emailSchema.safeParse({ email });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Informe um e-mail vÃ¡lido.");
        const result = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: `${window.location.origin}/redefinir-senha` });
        if (result.error) throw new Error(result.error.message);
        setMessage("Se o e-mail estiver cadastrado, vocÃª receberÃ¡ as instruÃ§Ãµes para redefinir a senha.");
      } else {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) throw new Error("Este link de redefiniÃ§Ã£o nÃ£o Ã© vÃ¡lido ou expirou.");
        const parsed = resetPasswordSchema.safeParse({ password: form.get("password") });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Confira a nova senha.");
        const result = await authClient.resetPassword({ newPassword: parsed.data.password, token });
        if (result.error) throw new Error(result.error.message);
        setMessage("Senha atualizada. VocÃª jÃ¡ pode entrar na sua conta.");
      }
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div><form onSubmit={submit} className="grid gap-5" noValidate>
        {mode === "register" && <label className="grid gap-2 text-sm font-medium text-[#34313a]" htmlFor="auth-name"><span>Seu nome</span><input className="h-12 rounded-lg border border-[#dedbe4] px-3.5 text-[15px] outline-none focus:border-[#7351d6] focus:ring-4 focus:ring-[#7351d6]/10" id="auth-name" name="name" autoComplete="name" required minLength={2} maxLength={120} aria-invalid={Boolean(error)} /></label>}
        {mode !== "reset" && <label className="grid gap-2 text-sm font-medium text-[#34313a]" htmlFor="auth-email"><span>E-mail</span><input className="h-12 rounded-lg border border-[#dedbe4] px-3.5 text-[15px] outline-none focus:border-[#7351d6] focus:ring-4 focus:ring-[#7351d6]/10" id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(error)} /></label>}
        {(mode === "login" || mode === "register" || mode === "reset") && <PasswordField name="password" label={mode === "reset" ? "Nova senha" : "Senha"} autoComplete={mode === "login" ? "current-password" : "new-password"} error={Boolean(error)} />}
        {mode === "register" && <PasswordField name="confirmPassword" label="Confirmar senha" autoComplete="new-password" error={Boolean(error)} />}
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
        <button className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#7351d6] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6544bf] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7351d6]/20 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy}>
          {busy ? <><LoaderCircle size={17} className="auth-spinner" /> Aguardeâ€¦</> : <>{mode === "login" ? "Entrar" : mode === "register" ? "Criar minha conta" : mode === "forgot" ? "Enviar instruÃ§Ãµes" : "Salvar nova senha"}<ArrowRight size={16} /></>}
        </button>
      </form>
      <div className="mt-6 grid gap-4 text-center text-sm text-[#716c79]">
        {mode === "login" && <><Link href="/recuperar-senha">Esqueci minha senha</Link><span>NÃ£o tem uma conta? <Link href="/cadastro">Criar conta</Link></span></>}
        {mode === "register" && <span>JÃ¡ tem uma conta? <Link href="/login">Entrar</Link></span>}
        {(mode === "forgot" || mode === "reset") && <Link href="/login">Voltar para o login</Link>}
      </div>
    </div>
  );
}



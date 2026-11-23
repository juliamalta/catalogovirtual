"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { AuthFormInputError, getAuthErrorMessage, submitSignUp } from "@/lib/auth/auth-errors";
import { emailSchema, resetPasswordSchema, signInSchema } from "@/lib/validations/auth";

export type AuthFormMode = "login" | "register" | "forgot" | "reset";

function PasswordField({ name, label, autoComplete, error }: { name: string; label: string; autoComplete: string; error: boolean }) {
  const [visible, setVisible] = useState(false);
  const id = `auth-${name}`;

  return (
    <label className="grid gap-2 text-sm font-medium text-ink" htmlFor={id}>
      <span>{label}</span>
      <span className="relative block">
        <input className="h-12 w-full rounded-lg border border-line bg-surface px-3.5 pr-12 text-[15px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={8} maxLength={128} aria-invalid={error} />
        <button className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-ink-secondary hover:bg-brand-soft hover:text-brand" type="button" aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`} onClick={() => setVisible((value) => !value)}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
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
        if (!parsed.success) throw new AuthFormInputError(parsed.error.issues[0]?.message ?? "Confira seus dados.");
        const result = await authClient.signIn.email({ ...parsed.data, callbackURL: "/painel" });
        if (result.error) throw result.error;
        router.replace("/painel");
        router.refresh();
      } else if (mode === "register") {
        const redirectTo = await submitSignUp({
          name: form.get("name"), email, password: form.get("password"), confirmPassword: form.get("confirmPassword")
        }, (payload) => authClient.signUp.email(payload));
        setMessage("Conta criada. Estamos abrindo seu painel…");
        router.replace(redirectTo);
        router.refresh();
      } else if (mode === "forgot") {
        const parsed = emailSchema.safeParse({ email });
        if (!parsed.success) throw new AuthFormInputError(parsed.error.issues[0]?.message ?? "Informe um e-mail válido.");
        const result = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: `${window.location.origin}/redefinir-senha` });
        if (result.error) throw result.error;
        setMessage("Se o e-mail estiver cadastrado, você receberá as instruções para redefinir a senha.");
      } else {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) throw new AuthFormInputError("Este link de redefinição não é válido ou expirou.");
        const parsed = resetPasswordSchema.safeParse({ password: form.get("password") });
        if (!parsed.success) throw new AuthFormInputError(parsed.error.issues[0]?.message ?? "Confira a nova senha.");
        const result = await authClient.resetPassword({ newPassword: parsed.data.password, token });
        if (result.error) throw result.error;
        setMessage("Senha atualizada. Você já pode entrar na sua conta.");
      }
    } catch (cause) {
      setError(getAuthErrorMessage(cause, mode));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div><form onSubmit={submit} className="grid gap-5" noValidate>
        {mode === "register" && <label className="grid gap-2 text-sm font-medium text-ink" htmlFor="auth-name"><span>Seu nome</span><input className="h-12 rounded-lg border border-line px-3.5 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="auth-name" name="name" autoComplete="name" required minLength={2} maxLength={120} aria-invalid={Boolean(error)} /></label>}
        {mode !== "reset" && <label className="grid gap-2 text-sm font-medium text-ink" htmlFor="auth-email"><span>E-mail</span><input className="h-12 rounded-lg border border-line px-3.5 text-[15px] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(error)} /></label>}
        {(mode === "login" || mode === "register" || mode === "reset") && <PasswordField name="password" label={mode === "reset" ? "Nova senha" : "Senha"} autoComplete={mode === "login" ? "current-password" : "new-password"} error={Boolean(error)} />}
        {mode === "register" && <PasswordField name="confirmPassword" label="Confirmar senha" autoComplete="new-password" error={Boolean(error)} />}
        {error && <p className="auth-feedback auth-error" role="alert">{error}</p>}
        {message && <p className="auth-feedback auth-success" role="status">{message}</p>}
        <button className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy}>
          {busy ? <><LoaderCircle size={17} className="auth-spinner" /> Aguarde…</> : <>{mode === "login" ? "Entrar" : mode === "register" ? "Criar minha conta" : mode === "forgot" ? "Enviar instruções" : "Salvar nova senha"}<ArrowRight size={16} /></>}
        </button>
      </form>
      <div className="mt-6 grid gap-4 text-center text-sm text-ink-secondary [&_a]:font-semibold [&_a]:text-brand-dark [&_a:hover]:text-brand-hover [&_a:hover]:underline [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-brand">
        {mode === "login" && <><Link href="/recuperar-senha">Esqueci minha senha</Link><span>Não tem uma conta? <Link href="/cadastro">Criar conta</Link></span></>}
        {mode === "register" && <span>Já tem uma conta? <Link href="/login">Entrar</Link></span>}
        {(mode === "forgot" || mode === "reset") && <Link href="/login">Voltar para o login</Link>}
      </div>
    </div>
  );
}



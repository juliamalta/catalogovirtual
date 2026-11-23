import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthForm, type AuthFormMode } from "@/components/auth/auth-form";

const copy: Record<AuthFormMode, { title: string; description: string }> = {
  register: { title: "Crie sua conta", description: "Comece a montar sua loja online." },
  login: { title: "Entre na sua conta", description: "Acesse sua loja e continue de onde parou." },
  forgot: { title: "Recupere sua senha", description: "Enviaremos instruções para o seu e-mail." },
  reset: { title: "Defina uma nova senha", description: "Escolha uma senha segura para sua conta." },
};

export function AuthPage({ mode }: { mode: AuthFormMode }) {
  const { title, description } = copy[mode];
  return (
    <main className="min-h-screen bg-canvas px-5 py-8 font-marketing text-ink sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[440px] flex-col">
        <header className="flex items-center justify-between gap-3 [&_.brand]:text-[17px] sm:[&_.brand]:text-2xl">
          <Brand />
          <Link href="/" className="shrink-0 text-xs text-ink-secondary transition hover:text-brand-dark sm:text-sm">Voltar ao início</Link>
        </header>
        <section className="my-auto py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">{title}</h1>
          <p className="mt-2 text-[15px] leading-6 text-ink-secondary">{description}</p>
          <div className="mt-8"><AuthForm mode={mode} /></div>
          <p className="mt-8 border-t border-line pt-5 text-xs leading-5 text-ink-secondary">Seus dados são usados somente para acessar e administrar sua loja.</p>
        </section>
        <footer className="pt-4 text-center text-xs text-ink-secondary">Catálogo Loja Virtual <span className="px-1">·</span> Acesso seguro à sua loja</footer>
      </div>
    </main>
  );
}

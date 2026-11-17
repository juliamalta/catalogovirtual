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
    <main className="min-h-screen bg-[#faf9fc] px-5 py-8 text-[#24212d] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[440px] flex-col">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <Link href="/" className="text-sm text-[#6b6673] transition hover:text-[#7351d6]">Voltar ao início</Link>
        </header>
        <section className="my-auto py-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">{title}</h1>
          <p className="mt-2 text-[15px] leading-6 text-[#716c79]">{description}</p>
          <div className="mt-8"><AuthForm mode={mode} /></div>
          <p className="mt-8 border-t border-[#eae7ef] pt-5 text-xs leading-5 text-[#85808c]">Seus dados são usados somente para acessar e administrar sua loja.</p>
        </section>
        <footer className="pt-4 text-center text-xs text-[#8a8591]">Catálogo Loja Virtual <span className="px-1">·</span> Acesso seguro à sua loja</footer>
      </div>
    </main>
  );
}

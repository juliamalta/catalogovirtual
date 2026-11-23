import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { CreateStoreWizard } from "@/components/onboarding/CreateStoreWizard";
import { requireUser } from "@/server/authorization";

export const dynamic = "force-dynamic";

export default async function NewStorePage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="flex h-[68px] items-center justify-between border-b border-line bg-surface px-5 sm:px-8 lg:px-12">
        <Brand />
        <Link href="/painel" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition hover:bg-canvas hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar ao painel</span><span className="sm:hidden">Painel</span>
        </Link>
      </header>
      <section className="px-4 py-8 sm:px-6 sm:py-12">
        <CreateStoreWizard />
      </section>
    </main>
  );
}

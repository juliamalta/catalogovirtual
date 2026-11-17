import { Link2, Store } from "lucide-react";

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";

interface StoreIdentityStepProps {
  name: string;
  slug: string;
  description: string;
  errors: Record<string, string>;
  slugStatus: SlugStatus;
  slugStatusMessage?: string;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

const inputClass = "w-full rounded-xl border border-[#e6e2eb] bg-white px-4 py-3 text-[15px] text-[#302a38] outline-none transition placeholder:text-[#aaa5b0] hover:border-[#cfc8d8] focus:border-[#8b6be0] focus:ring-4 focus:ring-[#7351d6]/10";

function FieldError({ id, children }: { id: string; children?: string }) {
  return children ? <p id={id} className="mt-1.5 text-xs text-[#b54756]">{children}</p> : null;
}

export function StoreIdentityStep({
  name, slug, description, errors, slugStatus, slugStatusMessage,
  onNameChange, onSlugChange, onDescriptionChange
}: StoreIdentityStepProps) {
  const slugStatusText = {
    idle: "Escolha um endereço curto e fácil de lembrar.",
    checking: "Verificando disponibilidade…",
    available: "Este endereço está disponível.",
    taken: "Este endereço já está em uso. Tente outra opção.",
    error: slugStatusMessage || "Não foi possível verificar o endereço agora."
  }[slugStatus];

  return (
    <section aria-labelledby="identity-title" className="space-y-6">
      <div>
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#f3effb] text-[#7351d6]"><Store size={19} /></span>
        <h2 id="identity-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-[#292431] outline-none sm:text-[28px]">Vamos começar pela sua marca.</h2>
        <p className="mt-2 text-sm leading-6 text-[#77717f]">Essas informações ajudam seus clientes a reconhecer e encontrar sua loja.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="store-name" className="mb-2 block text-sm font-semibold text-[#403a47]">Nome da loja</label>
          <input id="store-name" name="name" className={inputClass} value={name} onChange={(event) => onNameChange(event.target.value)} autoComplete="organization" placeholder="Ex.: Doce Encanto" maxLength={120} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "store-name-error" : undefined} />
          <FieldError id="store-name-error">{errors.name}</FieldError>
        </div>

        <div>
          <label htmlFor="store-slug" className="mb-2 block text-sm font-semibold text-[#403a47]">Endereço público</label>
          <div className={`flex overflow-hidden rounded-xl border bg-white transition focus-within:border-[#8b6be0] focus-within:ring-4 focus-within:ring-[#7351d6]/10 ${errors.slug ? "border-[#d98a94]" : "border-[#e6e2eb] hover:border-[#cfc8d8]"}`}>
            <span className="flex shrink-0 items-center border-r border-[#eeeaf1] bg-[#faf9fb] px-3 text-xs text-[#898390] sm:px-4 sm:text-sm">catalogolojavirtual.com.br/</span>
            <input id="store-slug" name="slug" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] text-[#302a38] outline-none placeholder:text-[#aaa5b0]" value={slug} onChange={(event) => onSlugChange(event.target.value)} autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="minha-loja" maxLength={60} aria-invalid={Boolean(errors.slug) || slugStatus === "taken"} aria-describedby={errors.slug ? "store-slug-error" : "store-slug-help"} />
            <span className="hidden items-center pr-3 text-[#a49eaa] sm:flex"><Link2 size={16} /></span>
          </div>
          <FieldError id="store-slug-error">{errors.slug}</FieldError>
          {!errors.slug && <p id="store-slug-help" aria-live="polite" className={`mt-1.5 text-xs ${slugStatus === "available" ? "text-[#27835d]" : slugStatus === "taken" || slugStatus === "error" ? "text-[#b54756]" : "text-[#898390]"}`}>{slugStatusText}</p>}
        </div>

        <div>
          <label htmlFor="store-description" className="mb-2 block text-sm font-semibold text-[#403a47]">Descrição <span className="font-normal text-[#96909c]">(opcional)</span></label>
          <textarea id="store-description" name="description" className={`${inputClass} min-h-24 resize-y`} value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Conte em poucas palavras o que sua loja oferece." maxLength={1000} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "store-description-error" : undefined} />
          <div className="mt-1 flex justify-between gap-3">
            <FieldError id="store-description-error">{errors.description}</FieldError>
            <span className="ml-auto text-xs text-[#aaa5b0]">{description.length}/1000</span>
          </div>
        </div>
      </div>
    </section>
  );
}

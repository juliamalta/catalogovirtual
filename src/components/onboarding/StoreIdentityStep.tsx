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

const inputClass = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink-secondary hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand/10";

function FieldError({ id, children }: { id: string; children?: string }) {
  return children ? <p id={id} className="mt-1.5 text-xs text-error">{children}</p> : null;
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
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Store size={19} /></span>
        <h2 id="identity-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-ink outline-none sm:text-[28px]">Vamos começar pela sua marca.</h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Essas informações ajudam seus clientes a reconhecer e encontrar sua loja.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="store-name" className="mb-2 block text-sm font-semibold text-ink">Nome da loja</label>
          <input id="store-name" name="name" className={inputClass} value={name} onChange={(event) => onNameChange(event.target.value)} autoComplete="organization" placeholder="Ex.: Doce Encanto" maxLength={120} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "store-name-error" : undefined} />
          <FieldError id="store-name-error">{errors.name}</FieldError>
        </div>

        <div>
          <label htmlFor="store-slug" className="mb-2 block text-sm font-semibold text-ink">Endereço público</label>
          <div className={`flex overflow-hidden rounded-xl border bg-surface transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10 ${errors.slug ? "border-error-border" : "border-line hover:border-brand/40"}`}>
            <span className="flex shrink-0 items-center border-r border-line bg-canvas px-3 text-xs text-ink-secondary sm:px-4 sm:text-sm">catalogolojavirtual.com.br/</span>
            <input id="store-slug" name="slug" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] text-ink outline-none placeholder:text-ink-secondary" value={slug} onChange={(event) => onSlugChange(event.target.value)} autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="minha-loja" maxLength={60} aria-invalid={Boolean(errors.slug) || slugStatus === "taken"} aria-describedby={errors.slug ? "store-slug-error" : "store-slug-help"} />
            <span className="hidden items-center pr-3 text-ink-secondary sm:flex"><Link2 size={16} /></span>
          </div>
          <FieldError id="store-slug-error">{errors.slug}</FieldError>
          {!errors.slug && <p id="store-slug-help" aria-live="polite" className={`mt-1.5 text-xs ${slugStatus === "available" ? "text-success" : slugStatus === "taken" || slugStatus === "error" ? "text-error" : "text-ink-secondary"}`}>{slugStatusText}</p>}
        </div>

        <div>
          <label htmlFor="store-description" className="mb-2 block text-sm font-semibold text-ink">Descrição <span className="font-normal text-ink-secondary">(opcional)</span></label>
          <textarea id="store-description" name="description" className={`${inputClass} min-h-24 resize-y`} value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Conte em poucas palavras o que sua loja oferece." maxLength={1000} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "store-description-error" : undefined} />
          <div className="mt-1 flex justify-between gap-3">
            <FieldError id="store-description-error">{errors.description}</FieldError>
            <span className="ml-auto text-xs text-ink-secondary">{description.length}/1000</span>
          </div>
        </div>
      </div>
    </section>
  );
}

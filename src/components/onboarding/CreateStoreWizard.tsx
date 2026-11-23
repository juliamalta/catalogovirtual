"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { checkStoreSlugAction, createStoreAction } from "@/app/painel/actions";
import { storeBluePreset } from "@/features/stores/store-appearance-colors";
import { createStoreSchema, slugify, storeSlugSchema, storefrontTypeSchema } from "@/lib/validations/store";
import type { StorefrontType } from "@/types/store.types";
import { StoreContactStep } from "./StoreContactStep";
import { StoreIdentityStep, type SlugStatus } from "./StoreIdentityStep";
import { StoreModelStep } from "./StoreModelStep";
import { StorePreview } from "./StorePreview";
import { WizardProgress } from "./WizardProgress";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  storefrontType: "CATALOG" as StorefrontType,
  whatsappNumber: "",
  primaryColor: storeBluePreset.value
};

function editableSlug(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-").slice(0, 60);
}

export function CreateStoreWizard() {
  const [state, action, pending] = useActionState(createStoreAction, {});
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugStatusMessage, setSlugStatusMessage] = useState<string>();
  const [slugTouched, setSlugTouched] = useState(false);
  const slugCheckRequest = useRef(0);
  const submitting = useRef(false);
  const previousStep = useRef(step);

  useEffect(() => {
    if (!slugTouched) setForm((current) => ({ ...current, slug: slugify(form.name) }));
  }, [form.name, slugTouched]);

  useEffect(() => {
    const parsed = storeSlugSchema.safeParse(form.slug);
    if (!parsed.success) {
      setSlugStatus("idle");
      setSlugStatusMessage(undefined);
      return;
    }

    const requestId = ++slugCheckRequest.current;
    setSlugStatus("checking");
    const timer = window.setTimeout(async () => {
      const result = await checkStoreSlugAction(parsed.data);
      if (requestId !== slugCheckRequest.current) return;
      setSlugStatus(result.available ? "available" : result.error ? "error" : "taken");
      setSlugStatusMessage(result.error);
    }, 400);

    return () => {
      window.clearTimeout(timer);
      if (slugCheckRequest.current === requestId) slugCheckRequest.current += 1;
    };
  }, [form.slug]);

  useEffect(() => {
    if (!pending) submitting.current = false;
  }, [pending]);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const titleId = step === 1 ? "identity-title" : step === 2 ? "model-title" : "contact-title";
    window.requestAnimationFrame(() => document.getElementById(titleId)?.focus());
  }, [step]);

  function updateField<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function checkSlugNow(slug: string) {
    const requestId = ++slugCheckRequest.current;
    setSlugStatus("checking");
    setSlugStatusMessage(undefined);
    const result = await checkStoreSlugAction(slug);
    if (requestId === slugCheckRequest.current) {
      setSlugStatus(result.available ? "available" : result.error ? "error" : "taken");
      setSlugStatusMessage(result.error);
    }
    return result;
  }

  function focusFirstError(nextErrors: Record<string, string>) {
    const field = Object.keys(nextErrors)[0];
    const fieldId = field === "whatsappNumber" ? "store-whatsapp" : `store-${field}`;
    if (field) window.requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  }

  async function continueFromIdentity() {
    const nextErrors: Record<string, string> = {};
    const nameResult = createStoreSchema.shape.name.safeParse(form.name);
    const slugResult = storeSlugSchema.safeParse(form.slug);
    const descriptionResult = createStoreSchema.shape.description.safeParse(form.description);
    if (!nameResult.success) nextErrors.name = "Informe o nome da loja (mínimo de 2 caracteres).";
    if (!slugResult.success) nextErrors.slug = slugResult.error.issues[0]?.message ?? "Informe um endereço válido.";
    if (!descriptionResult.success) nextErrors.description = "A descrição deve ter até 1000 caracteres.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstError(nextErrors);
      return;
    }
    if (!slugResult.success) return;

    const result = await checkSlugNow(slugResult.data);
    if (!result.available) {
      const message = result.error || "Esse endereço já está em uso. Escolha outro.";
      const slugErrors = { slug: message };
      setErrors(slugErrors);
      focusFirstError(slugErrors);
      return;
    }
    setStep(2);
  }

  function continueFromModel() {
    const result = storefrontTypeSchema.safeParse(form.storefrontType);
    if (!result.success) {
      setErrors({ storefrontType: "Escolha um formato para a sua loja." });
      return;
    }
    setErrors({});
    setStep(3);
  }

  function validateContact() {
    const result = createStoreSchema.shape.whatsappNumber.safeParse(form.whatsappNumber);
    if (!result.success) {
      const nextErrors = { whatsappNumber: result.error.issues[0]?.message ?? "Informe um WhatsApp com DDI e DDD." };
      setErrors(nextErrors);
      focusFirstError(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step !== 3 || submitting.current) {
      event.preventDefault();
      return;
    }
    if (!validateContact()) {
      event.preventDefault();
      return;
    }
    if (slugStatus !== "available") {
      event.preventDefault();
      setStep(1);
      setErrors({ slug: slugStatus === "checking" ? "Aguarde a verificação do endereço." : "Verifique se o endereço está disponível." });
      return;
    }
    submitting.current = true;
  }

  return (
    <div className="mx-auto w-full max-w-[1060px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand">Configuração inicial</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-[36px]">Crie sua loja</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-secondary">Um passo de cada vez. Você poderá ajustar tudo depois.</p>
        </div>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-secondary">Etapa {step} de 3</span>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-wizard lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <div className="p-5 sm:p-8 lg:p-10">
          <WizardProgress currentStep={step} />

          <form action={action} onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="primaryColor" value={form.primaryColor} />
            <div aria-live="polite">
              {state.error && <p role="alert" className="mb-5 rounded-xl border border-error-border bg-error-soft px-4 py-3 text-sm text-error">{state.error}</p>}
              {errors.storefrontType && <p role="alert" className="mb-5 rounded-xl border border-error-border bg-error-soft px-4 py-3 text-sm text-error">{errors.storefrontType}</p>}
            </div>

            <div hidden={step !== 1}>
              <StoreIdentityStep
                name={form.name}
                slug={form.slug}
                description={form.description}
                errors={errors}
                slugStatus={slugStatus}
                slugStatusMessage={slugStatusMessage}
                onNameChange={(value) => updateField("name", value)}
                onSlugChange={(value) => { setSlugTouched(true); updateField("slug", editableSlug(value)); }}
                onDescriptionChange={(value) => updateField("description", value)}
              />
            </div>

            <div hidden={step !== 2}>
              <StoreModelStep storefrontType={form.storefrontType} primaryColor={form.primaryColor} onSelect={(value) => { updateField("storefrontType", value); setErrors({}); }} />
            </div>

            <div hidden={step !== 3}>
              <StoreContactStep
                whatsappNumber={form.whatsappNumber}
                primaryColor={form.primaryColor}
                errors={errors}
                onWhatsappChange={(value) => updateField("whatsappNumber", value)}
                onPrimaryColorChange={(value) => updateField("primaryColor", value)}
              />
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
              {step > 1 ? (
                <button type="button" onClick={() => { setErrors({}); setStep((current) => current - 1); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink-secondary transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15">
                  <ArrowLeft size={16} /> Voltar
                </button>
              ) : <span />}

              {step < 3 ? (
                <button type="button" onClick={() => void (step === 1 ? continueFromIdentity() : continueFromModel())} disabled={step === 1 && slugStatus === "checking"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-wait disabled:opacity-65">
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={pending || slugStatus !== "available"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-wait disabled:opacity-65">
                  {pending ? <><LoaderCircle size={16} className="animate-spin" /> Criando loja…</> : <>Criar minha loja <Check size={16} /></>}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="border-t border-line bg-canvas p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-8">
          <div className="mb-4 hidden lg:block">
            <p className="text-sm font-semibold text-ink">Sua identidade em tempo real</p>
            <p className="mt-1 text-xs leading-5 text-ink-secondary">A prévia acompanha suas escolhas.</p>
          </div>
          <StorePreview {...form} />
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-secondary"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">i</span>Você poderá adicionar produtos e personalizar sua loja no painel.</p>
        </div>
      </div>
    </div>
  );
}

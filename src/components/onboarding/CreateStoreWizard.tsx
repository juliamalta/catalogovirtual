"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { checkStoreSlugAction, createStoreAction } from "@/app/painel/actions";
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
  primaryColor: "#7351D6"
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#8066b2]">Configuração inicial</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#292431] sm:text-[36px]">Crie sua loja</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#77717f]">Um passo de cada vez. Você poderá ajustar tudo depois.</p>
        </div>
        <span className="rounded-full border border-[#ebe7ef] bg-white px-3 py-1.5 text-xs font-medium text-[#77717f]">Etapa {step} de 3</span>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-[#eae6ee] bg-white shadow-[0_18px_50px_rgba(38,28,57,0.06)] lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <div className="p-5 sm:p-8 lg:p-10">
          <WizardProgress currentStep={step} />

          <form action={action} onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="primaryColor" value={form.primaryColor} />
            <div aria-live="polite">
              {state.error && <p role="alert" className="mb-5 rounded-xl border border-[#f1d5d8] bg-[#fff5f5] px-4 py-3 text-sm text-[#a23f4c]">{state.error}</p>}
              {errors.storefrontType && <p role="alert" className="mb-5 rounded-xl border border-[#f1d5d8] bg-[#fff5f5] px-4 py-3 text-sm text-[#a23f4c]">{errors.storefrontType}</p>}
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

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#f0edf2] pt-5">
              {step > 1 ? (
                <button type="button" onClick={() => { setErrors({}); setStep((current) => current - 1); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#625c69] transition hover:bg-[#f7f5f9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7351d6]/15">
                  <ArrowLeft size={16} /> Voltar
                </button>
              ) : <span />}

              {step < 3 ? (
                <button type="button" onClick={() => void (step === 1 ? continueFromIdentity() : continueFromModel())} disabled={step === 1 && slugStatus === "checking"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7351d6] px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(115,81,214,0.2)] transition hover:bg-[#6342c2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7351d6]/25 disabled:cursor-wait disabled:opacity-65">
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button type="submit" disabled={pending || slugStatus !== "available"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7351d6] px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(115,81,214,0.2)] transition hover:bg-[#6342c2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7351d6]/25 disabled:cursor-wait disabled:opacity-65">
                  {pending ? <><LoaderCircle size={16} className="animate-spin" /> Criando loja…</> : <>Criar minha loja <Check size={16} /></>}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="border-t border-[#eeeaf1] bg-[#fbfafc] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-8">
          <div className="mb-4 hidden lg:block">
            <p className="text-sm font-semibold text-[#403a47]">Sua identidade em tempo real</p>
            <p className="mt-1 text-xs leading-5 text-[#898390]">A prévia acompanha suas escolhas.</p>
          </div>
          <StorePreview {...form} />
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#898390]"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#eee9f7] text-[#7351d6]">i</span>Você poderá adicionar produtos e personalizar sua loja no painel.</p>
        </div>
      </div>
    </div>
  );
}

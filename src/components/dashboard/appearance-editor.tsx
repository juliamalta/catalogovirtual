"use client";

import { useMemo, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { upload, uploadPresigned } from "@vercel/blob/client";
import { BookOpen, Check, Grid2X2, Image as ImageIcon, LayoutTemplate, Palette, Store, Type, Upload } from "lucide-react";
import { cleanupUnattachedStoreAppearanceImageAction, saveStoreAppearanceAction } from "@/app/painel/actions";
import type { ProductImageMimeType, ProductImageUploadMode } from "@/features/images/image-storage.types";
import { storeBluePreset, storeDarkBluePreset } from "@/features/stores/store-appearance-colors";
import { Storefront } from "@/components/storefront/storefront";
import type { StoreDemo, StorefrontType } from "@/types/store.types";
import { AppearanceImageField, type AppearanceAssetType } from "./appearance-image-field";

interface AppearanceDraft {
  name: string;
  description: string;
  storefrontType: StorefrontType;
  headline: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  coverUrl: string;
}

interface AppearanceEditorProps {
  storeSlug: string;
  storeId: string;
  initialDraft: AppearanceDraft;
  previewStore: StoreDemo;
  blobConfigured: boolean;
  blobUploadMode?: ProductImageUploadMode | null;
  whatsappNumber: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
}

const tabs = [
  { id: "identity", label: "Sua marca", icon: Store },
  { id: "colors", label: "Cores", icon: Palette },
  { id: "banner", label: "Capa e textos", icon: Type },
  { id: "layout", label: "Modelo", icon: LayoutTemplate }
] as const;

const models: { value: StorefrontType; title: string; description: string; icon: typeof BookOpen }[] = [
  { value: "MENU", title: "Cardápio Digital", description: "Ideal para alimentos e bebidas.", icon: BookOpen },
  { value: "CATALOG", title: "Catálogo Online", description: "Uma forma versátil de organizar produtos.", icon: Grid2X2 },
  { value: "SHOWCASE", title: "Vitrine Online", description: "Destaque coleções e imagens.", icon: Store }
];

const colorPresets = [
  storeBluePreset,
  storeDarkBluePreset,
  { name: "Verde", value: "#0F766E" },
  { name: "Âmbar", value: "#B45309" },
  { name: "Rosa", value: "#BE4566" },
  { name: "Grafite", value: "#292634" }
];
const extensionByMime: Record<ProductImageMimeType, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function AppearanceEditor({ storeSlug, storeId, initialDraft, previewStore, blobConfigured, blobUploadMode = "legacy", whatsappNumber, deliveryEnabled, pickupEnabled }: AppearanceEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [files, setFiles] = useState<Partial<Record<AppearanceAssetType, File>>>({});
  const [progress, setProgress] = useState<Partial<Record<AppearanceAssetType, number>>>({});
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("identity");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function updateDraft<K extends keyof AppearanceDraft>(key: K, value: AppearanceDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function updateFile(assetType: AppearanceAssetType, file?: File) {
    setFiles((current) => {
      const next = { ...current };
      if (file) next[assetType] = file;
      else delete next[assetType];
      return next;
    });
    setProgress((current) => {
      const next = { ...current };
      delete next[assetType];
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  const preview = useMemo<StoreDemo>(() => {
    const name = draft.name.trim() || "Sua loja";
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
    return {
      ...previewStore,
      name,
      tagline: draft.headline.trim() || name,
      subtitle: draft.subtitle,
      description: draft.description,
      type: draft.storefrontType,
      accent: draft.primaryColor,
      background: draft.secondaryColor,
      logo: initials,
      logoUrl: draft.logoUrl || undefined,
      cover: draft.coverUrl
    };
  }, [draft, previewStore]);

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
    setActiveTab(nextTab.id);
    document.getElementById(`appearance-tab-${nextTab.id}`)?.focus();
  }

  async function uploadAppearanceImage(assetType: AppearanceAssetType, file: File) {
    const mimeType = file.type as ProductImageMimeType;
    const pathname = `stores/${storeId}/appearance/${assetType}/${crypto.randomUUID()}.${extensionByMime[mimeType]}`;
    const uploadImage = blobUploadMode === "presigned" ? uploadPresigned : upload;
    const blob = await uploadImage(pathname, file, {
      access: "public",
      handleUploadUrl: blobUploadMode === "presigned" ? "/api/stores/images/upload?mode=presigned" : "/api/stores/images/upload",
      contentType: mimeType,
      clientPayload: JSON.stringify({ storeSlug, assetType, mimeType, size: file.size }),
      onUploadProgress: ({ percentage }) => setProgress((current) => ({ ...current, [assetType]: Math.round(percentage) }))
    });
    return blob.url;
  }

  async function saveAppearance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const uploaded: { url: string; assetType: AppearanceAssetType }[] = [];
    setSaving(true);
    setError(undefined);
    setSaved(false);

    try {
      for (const assetType of ["logo", "cover"] as const) {
        const file = files[assetType];
        if (!file) continue;
        const url = await uploadAppearanceImage(assetType, file);
        uploaded.push({ url, assetType });
        formData.set(assetType === "logo" ? "logoUrl" : "coverUrl", url);
      }

      const result = await saveStoreAppearanceAction(storeSlug, formData);
      if (!result.success) throw new Error(result.error || "Não foi possível salvar as alterações.");
      setDraft((current) => ({
        ...current,
        logoUrl: uploaded.find((item) => item.assetType === "logo")?.url ?? current.logoUrl,
        coverUrl: uploaded.find((item) => item.assetType === "cover")?.url ?? current.coverUrl
      }));
      setFiles({});
      setProgress({});
      setDirty(false);
      setSaved(true);
      router.refresh();
    } catch (saveError) {
      await Promise.all(uploaded.map(({ url, assetType }) => cleanupUnattachedStoreAppearanceImageAction(storeSlug, url, assetType)));
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
      setProgress({});
    }
  }

  return (
    <form id="appearance-editor-form" className="appearance-editor-form" onSubmit={saveAppearance}>
      <input type="hidden" name="whatsappNumber" value={whatsappNumber} />
      <input type="hidden" name="deliveryEnabled" value={String(deliveryEnabled)} />
      <input type="hidden" name="pickupEnabled" value={String(pickupEnabled)} />
      <input type="hidden" name="logoUrl" value={draft.logoUrl} />
      <input type="hidden" name="coverUrl" value={draft.coverUrl} />

      <div className="appearance-editor-grid">
        <section className="appearance-config-column" aria-label="Configurações da loja">
          <div className="appearance-config-toolbar">
            <div><span className={`appearance-save-state${dirty ? " is-dirty" : saved ? " is-saved" : ""}`}><i />{dirty ? "Alterações não salvas" : saved ? "Alterações salvas" : "Tudo atualizado"}</span></div>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? <><Upload size={16} className="is-spinning" /> Salvando…</> : <><Check size={16} /> Salvar alterações</>}</button>
          </div>

          <fieldset disabled={saving} className="appearance-fields-group">
          <div className="appearance-tabs" role="tablist" aria-label="Grupos de configuração" onKeyDown={onTabKeyDown}>
            {tabs.map(({ id, label, icon: Icon }) => <button key={id} id={`appearance-tab-${id}`} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`appearance-panel-${id}`} tabIndex={activeTab === id ? 0 : -1} className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)}><Icon size={16} />{label}</button>)}
          </div>

          {error && <p className="auth-error appearance-feedback" role="alert">{error}</p>}
          {saved && <p className="notice-success appearance-feedback" role="status"><Check size={16} />A aparência da loja foi atualizada.</p>}

          <section id="appearance-panel-identity" role="tabpanel" aria-labelledby="appearance-tab-identity" hidden={activeTab !== "identity"} className="appearance-tab-panel">
            <div className="appearance-section-heading"><div className="appearance-section-icon"><Store size={18} /></div><div><h2>Identidade</h2><p>Os dados que representam sua marca em toda a loja.</p></div></div>
            <div className="appearance-field-grid">
              <label className="field appearance-field-wide">Nome comercial<input name="name" required maxLength={120} value={draft.name} onChange={(event) => updateDraft("name", event.currentTarget.value)} /></label>
              <label className="field appearance-field-wide">Descrição<textarea name="description" maxLength={1000} value={draft.description} onChange={(event) => updateDraft("description", event.currentTarget.value)} placeholder="Conte um pouco sobre sua loja." /></label>
            </div>
            <div className="appearance-media-stack">
              <AppearanceImageField assetType="logo" value={draft.logoUrl} file={files.logo} progress={progress.logo} blobConfigured={blobConfigured} disabled={saving} onFileChange={(file) => updateFile("logo", file)} onUrlChange={(value) => updateDraft("logoUrl", value)} />
            </div>
          </section>

          <section id="appearance-panel-colors" role="tabpanel" aria-labelledby="appearance-tab-colors" hidden={activeTab !== "colors"} className="appearance-tab-panel">
            <div className="appearance-section-heading"><div className="appearance-section-icon"><Palette size={18} /></div><div><h2>Cores da loja</h2><p>Escolha uma combinação que tenha a cara da sua marca.</p></div></div>
            <div className="appearance-color-card">
              <div className="appearance-color-card-copy"><strong>Cor principal</strong><span>Botões, links e destaques</span></div>
              <div className="appearance-primary-swatches" role="group" aria-label="Paleta de cores principais">
                {colorPresets.map(({ name, value }) => {
                  const selected = draft.primaryColor.toUpperCase() === value;
                  return <button key={value} type="button" className={selected ? "is-selected" : ""} style={{ "--swatch-color": value } as CSSProperties} onClick={() => updateDraft("primaryColor", value)} aria-label={name} aria-pressed={selected} />;
                })}
                <label className="appearance-custom-color" title="Escolher uma cor personalizada"><input name="primaryColor" type="color" value={draft.primaryColor} onChange={(event) => updateDraft("primaryColor", event.currentTarget.value)} aria-label="Cor principal personalizada" /><Palette size={16} /></label>
              </div>
            </div>
            <div className="appearance-color-card">
              <div className="appearance-color-card-copy"><strong>Cor de apoio</strong><span>Fundos e superfícies suaves</span></div>
              <label className="appearance-color-input"><span style={{ backgroundColor: draft.secondaryColor }} /><input name="secondaryColor" type="color" value={draft.secondaryColor} onChange={(event) => updateDraft("secondaryColor", event.currentTarget.value)} aria-label="Cor de apoio" /><code>{draft.secondaryColor.toUpperCase()}</code></label>
            </div>
            <div className="appearance-live-color-sample" style={{ "--sample-accent": draft.primaryColor, "--sample-background": draft.secondaryColor } as CSSProperties}>
              <span>Amostra da sua identidade</span><div><strong>{draft.name || "Sua loja"}</strong><button type="button">Conhecer produtos</button></div>
            </div>
          </section>

          <section id="appearance-panel-banner" role="tabpanel" aria-labelledby="appearance-tab-banner" hidden={activeTab !== "banner"} className="appearance-tab-panel">
            <div className="appearance-section-heading"><div className="appearance-section-icon"><ImageIcon size={18} /></div><div><h2>Banner principal</h2><p>Uma mensagem de boas-vindas para quem chega à loja.</p></div></div>
            <div className="appearance-field-grid">
              <label className="field appearance-field-wide">Título principal<input name="headline" maxLength={180} value={draft.headline} onChange={(event) => updateDraft("headline", event.currentTarget.value)} placeholder="Ex.: Feito com carinho para você" /></label>
              <label className="field appearance-field-wide">Subtítulo<textarea name="subtitle" maxLength={280} value={draft.subtitle} onChange={(event) => updateDraft("subtitle", event.currentTarget.value)} placeholder="Uma frase curta sobre seus produtos." /></label>
            </div>
            <div className="appearance-media-stack">
              <AppearanceImageField assetType="cover" value={draft.coverUrl} file={files.cover} progress={progress.cover} blobConfigured={blobConfigured} disabled={saving} onFileChange={(file) => updateFile("cover", file)} onUrlChange={(value) => updateDraft("coverUrl", value)} />
            </div>
          </section>

          <section id="appearance-panel-layout" role="tabpanel" aria-labelledby="appearance-tab-layout" hidden={activeTab !== "layout"} className="appearance-tab-panel">
            <div className="appearance-section-heading"><div className="appearance-section-icon"><LayoutTemplate size={18} /></div><div><h2>Modelo da loja</h2><p>Escolha como seus produtos serão apresentados.</p></div></div>
            <div className="appearance-model-options">
              {models.map(({ value, title, description, icon: Icon }) => <label key={value} className={`appearance-model-card${draft.storefrontType === value ? " is-selected" : ""}`}>
                <input type="radio" name="storefrontType" value={value} checked={draft.storefrontType === value} onChange={() => updateDraft("storefrontType", value)} />
                <span className="appearance-model-icon"><Icon size={18} /></span><span className="appearance-model-copy"><strong>{title}</strong><small>{description}</small></span><span className="appearance-model-check"><Check size={13} /></span>
              </label>)}
            </div>
          </section>
          </fieldset>
        </section>

        <aside className="appearance-preview-column" aria-label="Prévia da loja">
          <div className="appearance-preview-heading"><div><span>PRÉVIA AO VIVO</span><strong>{preview.name}</strong></div><span className="appearance-preview-dot"><i />Prévia privada</span></div>
          <div className="appearance-preview-frame" inert><Storefront store={preview} isPreview /></div>
          <p className="appearance-preview-note">Esta prévia usa o modelo público da sua loja e os produtos ativos cadastrados. As mudanças aparecem aqui sem afetar a loja publicada.</p>
        </aside>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { MAX_PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_MIME_TYPES } from "@/features/images/image-storage.types";
import { matchesImageSignature } from "@/features/images/validations";

export type AppearanceAssetType = "logo" | "cover";

interface AppearanceImageFieldProps {
  assetType: AppearanceAssetType;
  value: string;
  file?: File;
  progress?: number;
  blobConfigured: boolean;
  disabled: boolean;
  onFileChange: (file?: File) => void;
  onUrlChange: (value: string) => void;
}

const labels: Record<AppearanceAssetType, { title: string; description: string }> = {
  logo: { title: "Logo da loja", description: "Uma imagem quadrada funciona melhor." },
  cover: { title: "Banner principal", description: "Uma foto horizontal dá mais espaço para sua marca." }
};

export function AppearanceImageField({ assetType, value, file, progress, blobConfigured, disabled, onFileChange, onUrlChange }: AppearanceImageFieldProps) {
  const [localPreview, setLocalPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const label = labels[assetType];

  useEffect(() => {
    if (!file) {
      setLocalPreview(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setError(undefined);
    if (!selected) return;
    if (!(PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(selected.type)) {
      setError("Escolha uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (selected.size < 1 || selected.size > MAX_PRODUCT_IMAGE_SIZE) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    const signature = new Uint8Array(await selected.slice(0, 12).arrayBuffer());
    if (!matchesImageSignature(selected.type, signature)) {
      setError("O conteúdo do arquivo não corresponde ao formato da imagem.");
      return;
    }
    onFileChange(selected);
  }

  return (
    <div className="appearance-image-field">
      <div className={`appearance-image-preview appearance-image-preview-${assetType}`} role={localPreview || value ? "img" : undefined} aria-label={localPreview || value ? label.title : undefined} style={(localPreview || value) ? { backgroundImage: `url("${localPreview || value}")` } : undefined}>
        {!localPreview && !value && <ImagePlus size={22} aria-hidden="true" />}
        {file && <span className="appearance-image-local-badge">Prévia local</span>}
      </div>
      <div className="appearance-image-controls">
        <div><strong>{label.title}</strong><p>{label.description}</p></div>
        <div className="appearance-image-buttons">
          <label className={`appearance-image-pick${!blobConfigured || disabled ? " is-disabled" : ""}`}>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={!blobConfigured || disabled} onChange={(event) => void selectFile(event)} />
            <Upload size={15} />Escolher arquivo
          </label>
          {(file || value) && <button type="button" disabled={disabled} onClick={() => { onFileChange(undefined); onUrlChange(""); setError(undefined); }} aria-label={`Remover ${label.title.toLocaleLowerCase("pt-BR")}`}><Trash2 size={15} /></button>}
        </div>
        <label className="appearance-image-url">Link da imagem<input type="url" value={value} disabled={disabled} placeholder="https://..." onChange={(event) => { onFileChange(undefined); onUrlChange(event.currentTarget.value); }} /></label>
        {file && <small className="appearance-image-help">O arquivo será enviado ao salvar as alterações.</small>}
        {progress !== undefined && <div className="appearance-image-progress" role="status"><span>Enviando imagem… {progress}%</span><span><i style={{ width: `${progress}%` }} /></span></div>}
        {!blobConfigured && <small className="appearance-image-help">O envio de arquivos não está disponível agora. Você pode usar um link de imagem que comece com https://.</small>}
        {error && <small role="alert" className="appearance-image-error">{error}</small>}
      </div>
    </div>
  );
}

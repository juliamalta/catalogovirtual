"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyStoreLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setFailed(true);
      window.setTimeout(() => setFailed(false), 2600);
    }
  }

  return <button className="secondary-button dashboard-copy-button" type="button" onClick={copyLink} aria-live="polite">
    {copied ? <Check size={16} /> : <Copy size={16} />}
    {copied ? "Link copiado" : failed ? "Não foi possível copiar" : "Copiar link"}
  </button>;
}

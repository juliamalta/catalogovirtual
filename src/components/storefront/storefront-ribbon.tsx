import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DemoPill } from "@/components/brand";
import type { StorefrontRibbonProps } from "./storefront-component.types";

export function StorefrontRibbon({ storefrontType }: StorefrontRibbonProps) {
  const catalog = storefrontType === "CATALOG";
  return (
    <div className="demo-ribbon">
      <Link href="/" className={`back-home ${catalog ? "!text-[10px] md:!text-[11px]" : ""}`}>
        <ArrowLeft size={13} /> catalogolojavirtual.com.br
      </Link>
      <DemoPill className={catalog ? "!text-[9px] md:!text-[10px]" : ""} />
      <span className={catalog ? "!text-[10px] md:!text-xs" : ""}>
        Esta é uma loja demonstrativa
      </span>
    </div>
  );
}

import "@/components/storefront/storefront.css";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront/storefront";
import { requireAuthorizedStore } from "@/server/authorization";
import { getPublicStoreBySlug } from "@/server/queries/store.queries";

export default async function StorePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireAuthorizedStore(slug, "VIEW_DASHBOARD");
  const store = await getPublicStoreBySlug(slug, true);
  if (!store) notFound();

  const logo = store.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return <Storefront isPreview store={{
    slug: store.slug,
    name: store.name,
    tagline: store.tagline,
    subtitle: store.subtitle,
    description: store.description,
    type: store.type,
    whatsapp: store.whatsappNumber,
    accent: store.accent,
    background: store.background,
    logo,
    logoUrl: store.logoUrl ?? undefined,
    cover: store.coverUrl ?? "",
    categories: store.categories,
    products: store.products
  }} />;
}

import "@/components/storefront/storefront.css";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront/storefront";
import { getPublicStoreBySlug } from "@/server/queries/store.queries";
export const dynamic = "force-dynamic";
export default async function PublicStorePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const store=await getPublicStoreBySlug(slug);if(!store)notFound();const initials=store.name.split(/\s+/).slice(0,2).map((part)=>part[0]?.toUpperCase()??"").join("");return <Storefront store={{slug:store.slug,name:store.name,tagline:store.tagline,subtitle:store.subtitle,description:store.description,type:store.type,whatsapp:store.whatsappNumber,accent:store.accent,background:store.background,logo:initials,logoUrl:store.logoUrl??undefined,cover:store.coverUrl??"",categories:store.categories,products:store.products,delivery:store.delivery,operatingStatus:store.operatingStatus}}/>}

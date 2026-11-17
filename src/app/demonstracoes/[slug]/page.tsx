import "@/components/storefront/storefront.css";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront/storefront";
import { demoStores } from "@/features/stores/demo-data";
export function generateStaticParams() { return Object.keys(demoStores).map((slug)=>({slug})); }
export default async function DemoStorePage({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const store=demoStores[slug]; if(!store) notFound(); return <Storefront store={store}/>; }

import type { Metadata } from "next";
import "./globals.css";
import "./saas.css";
import "./dashboard-auth.css";
export const metadata: Metadata = { title: "Catálogo Loja Virtual — Sua loja online. Seus pedidos no WhatsApp.", description: "Cardápio, catálogo ou vitrine: crie um cantinho digital para mostrar o que você faz de melhor." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Brand } from "@/components/brand";
import type { FooterProps } from "./footer.types";

export function Footer({ brandName }: FooterProps) {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-about">
          <Brand name={brandName} />
          <p>Um espaço online para apresentar seu negócio e seus produtos.</p>
        </div>
        <div className="footer-col">
          <b>Explore</b>
          <a href="#formatos">Formatos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#experiencia">A experiência</a>
        </div>
        <div className="footer-col">
          <b>Conheça as demonstrações</b>
          <Link href="/demonstracoes/doce-encanto">Cardápio Digital</Link>
          <Link href="/demonstracoes/casa-aurora">Catálogo Online</Link>
          <Link href="/demonstracoes/casa-viva">Vitrine Online</Link>
        </div>
        <div className="footer-news">
          <span className="footer-stamp">
            <Sparkles size={20} />
          </span>
          <div>
            <b>Feito para quem faz.</b>
            <p>Com carinho, {brandName} © 2026</p>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>{brandName.toUpperCase()} — SUA LOJA ONLINE, SEUS PEDIDOS NO WHATSAPP.</span>
        <span>As lojas apresentadas são demonstrativas.</span>
      </div>
    </footer>
  );
}

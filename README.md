# Catálogo Loja Virtual

Protótipo de interface da Fase 1: landing page, três lojas demonstrativas e carrinho local com finalização pelo WhatsApp.

## Executar

Requer Node.js 22.12 ou superior para desenvolvimento e testes.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. As lojas de demonstração estão em `/demonstracoes/doce-encanto`, `/demonstracoes/casa-aurora` e `/demonstracoes/casa-viva`.

## Escopo desta versão

Os dados de loja e produtos são demonstrações tipadas em `src/features/stores/demo-data.ts`. O carrinho fica no armazenamento local do navegador, separado por loja. A finalização monta uma mensagem e abre o WhatsApp; nenhum pedido é enviado ou confirmado pelo site.

Não há banco, autenticação, painel administrativo, upload remoto ou pagamento nesta fase. As imagens da demonstração vêm do Unsplash. O WhatsApp e os produtos são dados de exemplo.

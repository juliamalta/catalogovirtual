# Configuração local do Vercel Blob

1. No projeto correto da Vercel, crie e conecte um Blob store com acesso **Public**. As imagens dos produtos são exibidas nas páginas públicas das lojas.
2. Selecione os ambientes que devem receber `BLOB_READ_WRITE_TOKEN`. A Vercel cria a variável ao conectar o store; não compartilhe nem versione o valor.
3. Para desenvolvimento local, obtenha a variável pelo Vercel CLI depois de vincular este checkout ao projeto. O CLI não está instalado nem vinculado neste workspace.
4. Os callbacks do Vercel Blob não conseguem acessar `localhost`. Para testar uploads em desenvolvimento, configure `VERCEL_BLOB_CALLBACK_URL` com a origem HTTPS temporária de um túnel público (sem caminho, por exemplo `https://exemplo-tunel.app`); o SDK acrescenta o caminho da rota automaticamente.
5. Reinicie o servidor Next.js depois de configurar as variáveis. Sem `BLOB_READ_WRITE_TOKEN`, o seletor de arquivos permanece desativado e a rota de autorização responde com `503`.

O fluxo usa `@vercel/blob` client uploads: o navegador recebe um token limitado e temporário do servidor. A credencial de escrita permanece no servidor.

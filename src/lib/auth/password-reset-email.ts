interface ResetEmailInput {
  email: string;
  name: string;
  url: string;
}

export async function sendPasswordResetEmail({ email, name, url }: ResetEmailInput): Promise<void> {
  const endpoint = process.env.PASSWORD_RESET_EMAIL_ENDPOINT;
  const apiKey = process.env.PASSWORD_RESET_EMAIL_API_KEY;
  const from = process.env.PASSWORD_RESET_EMAIL_FROM;
  if (!endpoint || !apiKey || !from) {
    throw new Error("O envio de e-mail de recuperação não está configurado. Defina as variáveis PASSWORD_RESET_EMAIL no ambiente do servidor.");
  }

  const emailEndpoint = new URL(endpoint);
  if (emailEndpoint.protocol !== "https:") throw new Error("O endpoint de e-mail deve usar HTTPS.");
  const response = await fetch(emailEndpoint, {
    method: "POST",
    redirect: "error",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Redefina sua senha — Catálogo Loja Virtual",
      text: `Olá, ${name}. Use este link para redefinir sua senha: ${url}\n\nSe você não pediu essa alteração, ignore este e-mail.`
    })
  });
  if (!response.ok) throw new Error("Não foi possível enviar o e-mail de recuperação.");
}

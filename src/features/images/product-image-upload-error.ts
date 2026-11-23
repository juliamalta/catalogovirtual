// The Blob SDK discards the endpoint's error body on a non-2xx response.
// Keep infrastructure details out of the merchant's retry instructions.
export function productImageUploadErrorMessage(error: unknown) {
  if (error instanceof Error && /Failed to\s+retrieve the (?:presigned URL|client token)/.test(error.message)) {
    return "Não foi possível autorizar o envio da foto. Tente salvar novamente. Se o problema continuar, entre em contato com o administrador da loja.";
  }
  return error instanceof Error ? error.message : "Não foi possível enviar a imagem. Tente salvar novamente.";
}

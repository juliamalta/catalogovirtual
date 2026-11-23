import { describe, expect, it, vi } from "vitest";
import { getAuthErrorMessage, submitSignUp } from "@/lib/auth/auth-errors";

const validSignup = {
  name: "Julia Malta",
  email: "julia@example.com",
  password: "senha-segura-123",
  confirmPassword: "senha-segura-123"
};

describe("cadastro Better Auth", () => {
  it("envia dados válidos e devolve o destino do painel após o sucesso", async () => {
    const send = vi.fn(async () => ({ error: null }));

    await expect(submitSignUp(validSignup, send)).resolves.toBe("/painel");
    expect(send).toHaveBeenCalledWith({
      name: "Julia Malta",
      email: "julia@example.com",
      password: "senha-segura-123",
      callbackURL: "/painel"
    });
  });

  it("não envia dados inválidos nem senhas diferentes", async () => {
    const send = vi.fn(async () => ({ error: null }));

    await expect(submitSignUp({ ...validSignup, email: "invalido" }, send)).rejects.toThrow("Informe um e-mail válido.");
    await expect(submitSignUp({ ...validSignup, password: "curta" }, send)).rejects.toThrow("pelo menos 8 caracteres");
    await expect(submitSignUp({ ...validSignup, confirmPassword: "outra-senha" }, send)).rejects.toThrow("As senhas não coincidem.");
    expect(send).not.toHaveBeenCalled();
  });

  it("não confirma se o e-mail já existe", () => {
    const message = getAuthErrorMessage({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", status: 422 }, "register");
    expect(message).toContain("Se você já tem uma conta");
    expect(message).not.toContain("julia@example.com");
  });

  it("traduz códigos de validação do servidor", () => {
    expect(getAuthErrorMessage({ code: "PASSWORD_TOO_SHORT" }, "register")).toContain("pelo menos 8 caracteres");
    expect(getAuthErrorMessage({ code: "VALIDATION_ERROR" }, "register")).toContain("Confira o nome, o e-mail e a senha");
  });

  it("traduz erros de origem sem expor detalhes internos", () => {
    expect(getAuthErrorMessage({ code: "INVALID_ORIGIN", message: "Invalid origin" }, "register"))
      .toBe("Esta página ficou desatualizada. Atualize-a e tente novamente.");
  });

  it("mostra uma mensagem temporária para falhas de conexão ou servidor", () => {
    const networkMessage = getAuthErrorMessage(new TypeError("fetch failed"), "register");
    const serverMessage = getAuthErrorMessage({ code: "INTERNAL_SERVER_ERROR", message: "database password leaked" }, "register");

    expect(networkMessage).toContain("instabilidade temporária");
    expect(serverMessage).toContain("instabilidade temporária");
    expect(serverMessage).not.toContain("database password");
  });

  it("usa uma mensagem genérica para erros desconhecidos", () => {
    expect(getAuthErrorMessage(new Error("internal stack trace"), "register"))
      .toBe("Não foi possível criar sua conta. Confira os dados e tente novamente.");
  });
});

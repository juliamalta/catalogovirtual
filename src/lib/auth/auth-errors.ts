import { signUpSchema } from "@/lib/validations/auth";

export type AuthFormAction = "login" | "register" | "forgot" | "reset";

export class AuthFormInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthFormInputError";
  }
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  callbackURL: "/painel";
}

interface SignUpResponse {
  error?: unknown | null;
}

export type SignUpRequest = (payload: SignUpPayload) => Promise<SignUpResponse>;

export async function submitSignUp(
  values: { name: unknown; email: unknown; password: unknown; confirmPassword: unknown },
  send: SignUpRequest
) {
  const parsed = signUpSchema.safeParse({ name: values.name, email: values.email, password: values.password });
  if (!parsed.success) {
    throw new AuthFormInputError(parsed.error.issues[0]?.message ?? "Confira os dados informados.");
  }
  if (parsed.data.password !== values.confirmPassword) {
    throw new AuthFormInputError("As senhas não coincidem.");
  }

  const result = await send({ ...parsed.data, callbackURL: "/painel" });
  if (result.error) throw result.error;
  return "/painel" as const;
}

function errorDetails(error: unknown) {
  const source = typeof error === "object" && error !== null ? error as Record<string, unknown> : {};
  const code = typeof source.code === "string" ? source.code.toUpperCase() : "";
  const message = error instanceof Error
    ? error.message
    : typeof source.message === "string" ? source.message : typeof error === "string" ? error : "";
  const status = Number(source.status ?? source.statusCode ?? 0);
  return { code, message, status };
}

const fallbackMessages: Record<AuthFormAction, string> = {
  login: "Não foi possível entrar. Confira seus dados e tente novamente.",
  register: "Não foi possível criar sua conta. Confira os dados e tente novamente.",
  forgot: "Não foi possível enviar as instruções agora. Tente novamente mais tarde.",
  reset: "Não foi possível atualizar sua senha. Gere um novo link e tente novamente."
};

export function getAuthErrorMessage(error: unknown, action: AuthFormAction) {
  if (error instanceof AuthFormInputError) return error.message;

  const { code, message, status } = errorDetails(error);
  if (code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "Não foi possível criar uma conta com esses dados. Se você já tem uma conta, entre ou recupere sua senha.";
  }
  if (code === "PASSWORD_TOO_SHORT") return "A senha deve ter pelo menos 8 caracteres.";
  if (code === "PASSWORD_TOO_LONG") return "A senha deve ter no máximo 128 caracteres.";
  if (code === "VALIDATION_ERROR") return "Confira o nome, o e-mail e a senha informados.";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
  if (code === "INVALID_ORIGIN" || /invalid origin/i.test(message)) {
    return "Esta página ficou desatualizada. Atualize-a e tente novamente.";
  }

  if (
    error instanceof TypeError
    || code === "INTERNAL_SERVER_ERROR"
    || code === "UNABLE_TO_CREATE_USER"
    || code === "UNABLE_TO_CREATE_SESSION"
    || status === 503
    || status >= 500
    || /failed to fetch|network|connection|conexão|timeout|econn|socket/i.test(message)
    || /^(ECONN|ETIMEDOUT|ENET|EHOST)/i.test(code)
  ) {
    return "Estamos com uma instabilidade temporária. Verifique sua conexão e tente novamente em instantes.";
  }

  return fallbackMessages[action];
}

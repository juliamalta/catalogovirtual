import { z } from "zod";

const emailField = () => z.string().trim().max(254, "O e-mail deve ter no máximo 254 caracteres.").email("Informe um e-mail válido.");
const passwordField = () => z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128, "A senha deve ter no máximo 128 caracteres.");

export const signInSchema = z.object({ email: emailField(), password: passwordField() });
export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres.").max(120, "O nome deve ter no máximo 120 caracteres."),
  email: emailField(),
  password: passwordField()
});
export const emailSchema = z.object({ email: emailField() });
export const resetPasswordSchema = z.object({ password: passwordField() });

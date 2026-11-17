import { z } from "zod";

export const signInSchema = z.object({ email: z.string().trim().email(), password: z.string().min(8).max(128) });
export const signUpSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email(), password: z.string().min(8).max(128) });
export const emailSchema = z.object({ email: z.string().trim().email() });
export const resetPasswordSchema = z.object({ password: z.string().min(8).max(128) });

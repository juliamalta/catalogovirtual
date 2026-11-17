import { z } from "zod";

const reservedStoreSlugs = new Set(["api", "login", "cadastro", "recuperar-senha", "painel", "demonstracoes", "_next", "favicon.ico"]);
export const storefrontTypeSchema = z.enum(["MENU", "CATALOG", "SHOWCASE"]);

export const storeSlugSchema = z.string().trim().toLowerCase().min(2).max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens.")
  .refine((slug) => !reservedStoreSlugs.has(slug), "Esse endereço está reservado.");

const whatsappSchema = z.string().transform((value) => value.replace(/\D/g, ""))
  .refine((value) => /^55\d{10,11}$/.test(value), "Informe um número com DDI 55 e DDD.");

export const createStoreSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: storeSlugSchema,
  description: z.string().trim().max(1000).default(""),
  storefrontType: storefrontTypeSchema,
  whatsappNumber: whatsappSchema,
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7351D6")
});

export const updateStoreSchema = createStoreSchema.omit({ slug: true }).extend({
  currentSlug: storeSlugSchema,
  headline: z.string().trim().max(180).default(""),
  subtitle: z.string().trim().max(280).default(""),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#F5F2FF"),
  deliveryEnabled: z.boolean().default(false),
  pickupEnabled: z.boolean().default(true),
  logoUrl: z.string().trim().max(2048).optional().or(z.literal("")).refine((value) => !value || /^https:\/\//i.test(value), "O logo deve usar HTTPS."),
  coverUrl: z.string().trim().max(2048).optional().or(z.literal("")).refine((value) => !value || /^https:\/\//i.test(value), "A capa deve usar HTTPS.")
});

const priceToCents = z.string().trim().regex(/^\d{1,7}(?:,\d{1,2})?$/, "Use o formato 12,50.").transform((value) => {
  const [reais, fraction = ""] = value.split(",");
  return Number(reais) * 100 + Number(fraction.padEnd(2, "0"));
}).refine((value) => Number.isSafeInteger(value) && value >= 0, "O preço deve ser válido.");

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).default(""),
  price: priceToCents,
  categoryId: z.string().uuid().optional().or(z.literal("")),
  imageUrl: z.string().trim().max(2048).optional().or(z.literal("")).refine((value) => !value || /^https:\/\//i.test(value), "A imagem deve usar HTTPS."),
  options: z.string().max(1200).default("").transform((value) => [...new Set(value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))].slice(0, 30)),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100_000).default(0)
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).default(""),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
  isActive: z.boolean().default(true)
});

export const storeSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  headline: z.string().trim().max(180),
  subtitle: z.string().trim().max(280),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  openingHours: z.record(z.string(), z.string().max(80)).default({})
});

export const imageUploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(5 * 1024 * 1024)
});

export function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

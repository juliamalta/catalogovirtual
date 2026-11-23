import { z } from "zod";

const fixedFeeSchema = z.string().trim().regex(/^\d{1,7}(?:[,.]\d{1,2})?$/, "Informe a taxa no formato 12,50.").transform((value) => {
  const [whole, fraction = ""] = value.replace(".", ",").split(",");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
});

export const deliveryFeeInputSchema = z.discriminatedUnion("feeType", [
  z.object({ feeType: z.literal("FIXED"), fixedFee: fixedFeeSchema }).transform(({ feeType, fixedFee }) => ({ feeType, fixedFeeCents: fixedFee })),
  z.object({ feeType: z.literal("FREE") }).transform(({ feeType }) => ({ feeType, fixedFeeCents: null })),
  z.object({ feeType: z.literal("TO_AGREE") }).transform(({ feeType }) => ({ feeType, fixedFeeCents: null })),
]);

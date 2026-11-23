import { describe, expect, it } from "vitest";
import { availableFulfillmentModes, calculateCheckout, type DeliveryConfiguration } from "./checkout";
import { makeOrderMessage } from "./whatsapp";
import { demoStores } from "@/features/stores/demo-data";
import { deliveryFeeInputSchema } from "@/lib/validations/delivery";
import type { CartLine } from "@/types/store.types";

const configuration: DeliveryConfiguration = { deliveryEnabled: true, pickupEnabled: true, feeType: "FIXED", fixedFeeCents: 755 };
const lines: CartLine[] = [
  { key: "a", product: { ...demoStores["doce-encanto"].products[0], priceCents: 1010 }, quantity: 2 },
  { key: "b", product: { ...demoStores["doce-encanto"].products[1], priceCents: 535 }, quantity: 3 },
];

describe("checkout delivery and message agreement", () => {
  for (const store of Object.values(demoStores)) {
    it(`${store.type}: fixed fee, multiple products and decimal prices`, () => {
      expect(calculateCheckout(lines, configuration, "DELIVERY")).toMatchObject({ subtotalCents: 3625, feeCents: 755, totalCents: 4380, canCheckout: true });
      const message = makeOrderMessage({ ...store, delivery: configuration }, lines, "DELIVERY");
      expect(message).toContain(store.name);
      expect(message).toContain("Subtotal dos produtos: R$\u00a036,25");
      expect(message).toContain("Taxa de entrega: R$\u00a07,55");
      expect(message).toContain("Total final: R$\u00a043,80");
    });
    it(`${store.type}: free delivery is distinct from an unknown fee`, () => {
      const free = { ...configuration, feeType: "FREE" as const, fixedFeeCents: null };
      expect(calculateCheckout(lines, free, "DELIVERY").totalCents).toBe(3625);
      const message = makeOrderMessage({ ...store, delivery: free }, lines, "DELIVERY");
      expect(message).toContain("Grátis");
      expect(message).toContain("Total final:");
      expect(message).not.toContain("Frete a combinar");
    });
    it(`${store.type}: unknown freight never presents a final total`, () => {
      const unknown = { ...configuration, feeType: "TO_AGREE" as const, fixedFeeCents: null };
      expect(calculateCheckout(lines, unknown, "DELIVERY")).toMatchObject({ totalCents: null, feeCents: null, freightToAgree: true });
      const message = makeOrderMessage({ ...store, delivery: unknown }, lines, "DELIVERY");
      expect(message).toContain("Frete a combinar");
      expect(message).toContain("O subtotal não inclui o frete");
      expect(message).not.toContain("Total final:");
    });
    it(`${store.type}: pickup has no freight and changing modes recalculates`, () => {
      const pickupOnly = { ...configuration, deliveryEnabled: false };
      expect(availableFulfillmentModes(pickupOnly)).toEqual(["PICKUP"]);
      expect(calculateCheckout(lines, configuration, "PICKUP")).toMatchObject({ totalCents: 3625, feeCents: 0 });
      expect(calculateCheckout(lines, configuration, "DELIVERY").totalCents).toBe(4380);
      const message = makeOrderMessage({ ...store, delivery: pickupOnly }, lines, "PICKUP");
      expect(message).toContain("Retirada no local");
      expect(message).not.toMatch(/combinar a entrega|Taxa de entrega/);
      expect(() => makeOrderMessage({ ...store, delivery: pickupOnly }, lines, "DELIVERY")).toThrow();
    });
  }
  it("does not finalize without an available modality or with an empty cart", () => {
    expect(calculateCheckout(lines, { ...configuration, deliveryEnabled: false, pickupEnabled: false }, null).canCheckout).toBe(false);
    expect(calculateCheckout([], configuration, "DELIVERY").totalCents).toBeNull();
    expect(() => calculateCheckout(lines, { ...configuration, fixedFeeCents: null }, "DELIVERY")).toThrow();
  });
  it("accepts integer cents including zero, and rejects invalid or overflowing amounts", () => {
    expect(calculateCheckout(lines, { ...configuration, fixedFeeCents: 0 }, "DELIVERY").totalCents).toBe(3625);
    expect(() => calculateCheckout(lines, { ...configuration, fixedFeeCents: -1 }, "DELIVERY")).toThrow();
    expect(() => calculateCheckout([{ ...lines[0], product: { ...lines[0].product, priceCents: Number.MAX_SAFE_INTEGER } }], configuration, "PICKUP")).toThrow();
  });
  it("validates BRL input without floating point rounding or silent coercion", () => {
    for (const value of ["12,50", "12.50"]) expect(deliveryFeeInputSchema.parse({ feeType: "FIXED", fixedFee: value }).fixedFeeCents).toBe(1250);
    expect(deliveryFeeInputSchema.parse({ feeType: "FIXED", fixedFee: "0,10" }).fixedFeeCents).toBe(10);
    for (const value of ["", "-1", "12,501", "1.000,50", "NaN", "1e2"]) expect(deliveryFeeInputSchema.safeParse({ feeType: "FIXED", fixedFee: value }).success).toBe(false);
    expect(deliveryFeeInputSchema.parse({ feeType: "FREE", fixedFee: "999" }).fixedFeeCents).toBeNull();
    expect(deliveryFeeInputSchema.safeParse({ feeType: "OTHER" }).success).toBe(false);
  });
});

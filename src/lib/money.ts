export const DEFAULT_CURRENCY = "MAD";

export function formatMoney(cents: number, currency = DEFAULT_CURRENCY) {
  const amount = cents / 100;
  const formatted = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function applyDiscount(
  subtotalCents: number,
  type: "PERCENTAGE" | "FIXED",
  value: number,
) {
  const discount =
    type === "PERCENTAGE"
      ? Math.round((subtotalCents * value) / 100)
      : value;
  const safeDiscount = Math.min(Math.max(discount, 0), subtotalCents);
  return {
    discountCents: safeDiscount,
    totalCents: subtotalCents - safeDiscount,
  };
}

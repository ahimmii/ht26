"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutAction } from "@/app/actions/checkout";
import { readCampaign } from "@/components/ui/campaign-tracker";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n-dictionary";
import type { Locale } from "@/lib/i18n";

type PromoState = {
  code: string;
  discountCents: number;
  totalCents: number;
} | null;

export function CheckoutForm({
  locale,
  quantity,
  unitPriceCents,
  currency,
  cmiEnabled,
  stripeEnabled,
}: {
  locale: Locale;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  cmiEnabled: boolean;
  stripeEnabled: boolean;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkoutAction, undefined);
  const [promo, setPromo] = useState<PromoState>(null);
  const [campaign] = useState<ReturnType<typeof readCampaign>>(readCampaign);
  const total = promo?.totalCents ?? unitPriceCents * quantity;

  useEffect(() => {
    if (state && typeof state === "object" && "redirect" in state && state.redirect) {
      if (state.redirect.method === "GET") {
        window.location.href = state.redirect.url;
        return;
      }
      const form = document.createElement("form");
      form.method = state.redirect.method;
      form.action = state.redirect.url;
      Object.entries(state.redirect.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    }
    if (state && typeof state === "object" && "pending" in state && state.reference) {
      router.push(`/orders/${state.reference}/pending`);
    }
  }, [router, state]);

  const error = useMemo(() => {
    if (state && typeof state === "object" && "error" in state) return state.error;
    return null;
  }, [state]);

  async function applyPromo(form: HTMLFormElement) {
    const code = String(new FormData(form).get("promoCode") ?? "");
    const email = String(new FormData(form).get("email") ?? "");
    if (!code) return;
    const response = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email: email || undefined, quantity }),
    });
    const data = await response.json();
    if (!response.ok) {
      setPromo(null);
      alert(data.error);
      return;
    }
    setPromo({ code: data.code, discountCents: data.discountCents, totalCents: data.totalCents });
  }

  return (
    <form action={formAction} className="mx-auto max-w-xl space-y-8">
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="ambassadorCode" value={campaign.ambassadorCode ?? ""} />
      <input type="hidden" name="utmSource" value={campaign.utmSource ?? ""} />
      <input type="hidden" name="utmMedium" value={campaign.utmMedium ?? ""} />
      <input type="hidden" name="utmCampaign" value={campaign.utmCampaign ?? ""} />

      <div>
        <p className="eyebrow">Checkout</p>
        <h1 className="font-serif mt-4 text-5xl">{t.checkout.title}</h1>
      </div>

      <label className="block">
        <span className="eyebrow">{t.checkout.name}</span>
        <input name="fullName" required className="input-dark" />
      </label>
      <label className="block">
        <span className="eyebrow">{t.checkout.email}</span>
        <input name="email" type="email" required className="input-dark" />
      </label>
      <label className="block">
        <span className="eyebrow">{t.checkout.phone}</span>
        <input name="phone" defaultValue="+212" required className="input-dark" />
      </label>

      <div className="flex items-end gap-4">
        <label className="block flex-1">
          <span className="eyebrow">{t.checkout.promo}</span>
          <input name="promoCode" defaultValue={promo?.code ?? ""} className="input-dark" />
        </label>
        <button
          type="button"
          className="btn-ghost px-4 py-3"
          onClick={(event) => applyPromo(event.currentTarget.form!)}
        >
          {t.checkout.apply}
        </button>
      </div>

      <fieldset className="space-y-3">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="radio"
            name="paymentMethod"
            value="STRIPE"
            defaultChecked={stripeEnabled}
            disabled={!stripeEnabled}
          />
          {t.checkout.payStripe}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="radio" name="paymentMethod" value="MANUAL" defaultChecked={!stripeEnabled} />
          {t.checkout.payManual}
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="radio" name="paymentMethod" value="CMI" disabled={!cmiEnabled} />
          {t.checkout.payCmi}
        </label>
        {!stripeEnabled ? <p className="text-xs text-mist">{t.checkout.stripeUnavailable}</p> : null}
        {!cmiEnabled ? <p className="text-xs text-mist">{t.checkout.cmiUnavailable}</p> : null}
      </fieldset>

      <label className="flex items-start gap-3 text-sm text-mist">
        <input type="checkbox" name="acceptTerms" className="mt-1" required />
        {t.checkout.terms}
      </label>

      <div className="flex items-end justify-between border-t border-white/10 pt-6">
        <p className="text-mist">{quantity} × {formatMoney(unitPriceCents, currency)}</p>
        <p className="font-serif text-3xl">{formatMoney(total, currency)}</p>
      </div>
      {promo ? (
        <p className="text-sm text-mist">
          {promo.code}: −{formatMoney(promo.discountCents, currency)}
        </p>
      ) : null}
      {error ? <p className="text-blood">{error}</p> : null}

      <button disabled={pending} className="btn-blood w-full">
        {pending ? "…" : t.checkout.place}
      </button>
    </form>
  );
}

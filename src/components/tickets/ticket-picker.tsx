"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n-dictionary";
import type { Locale } from "@/lib/i18n";

export function TicketPicker({
  locale,
  priceCents,
  currency,
  remaining,
  salesOpen,
  soldOut,
}: {
  locale: Locale;
  priceCents: number;
  currency: string;
  remaining: number;
  salesOpen: boolean;
  soldOut: boolean;
}) {
  const t = getDictionary(locale);
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(6, Math.max(0, remaining));
  const total = useMemo(() => priceCents * quantity, [priceCents, quantity]);
  const blocked = !salesOpen || soldOut || remaining <= 0;

  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow">General admission</p>
      <h1 className="font-serif mt-6 text-5xl">{t.tickets.title}</h1>
      <p className="mt-4 text-mist">{t.tickets.subtitle}</p>

      <div className="mt-12 space-y-8 border-t border-white/10 pt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">{t.tickets.quantity}</p>
            <div className="mt-4 flex items-center gap-6 text-3xl font-display">
              <button
                type="button"
                className="text-mist"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={blocked}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                className="text-mist"
                onClick={() => setQuantity((value) => Math.min(max || 1, value + 1))}
                disabled={blocked}
              >
                +
              </button>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-mist">{t.tickets.max}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">{t.tickets.each}</p>
            <p className="mt-4 font-serif text-3xl">{formatMoney(priceCents, currency)}</p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-white/10 pt-8">
          <div>
            <p className="eyebrow">{t.tickets.remaining}</p>
            <p className="mt-3 font-serif text-2xl">{remaining}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow">{t.tickets.total}</p>
            <p className="mt-3 font-serif text-2xl">{formatMoney(total, currency)}</p>
          </div>
        </div>

        {blocked ? (
          <p className="text-blood">
            {!salesOpen ? t.tickets.closed : t.tickets.soldOut}
          </p>
        ) : (
          <Link href={`/checkout?qty=${quantity}`} className="btn-blood w-full">
            {t.tickets.checkout}
          </Link>
        )}
      </div>
    </div>
  );
}

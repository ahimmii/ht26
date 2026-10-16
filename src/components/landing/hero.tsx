"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n-dictionary";
import type { Locale } from "@/lib/i18n";
import { BrandMark } from "@/components/ui/brand-mark";
import { Countdown } from "./countdown";
import { HeroVilla } from "./hero-villa";

export function Hero({
  locale,
  title,
  tagline,
  dateLine,
  eventDate,
  priceCents,
  currency,
  capacity,
}: {
  locale: Locale;
  title: string;
  tagline: string;
  dateLine: string;
  eventDate: string;
  priceCents: number;
  currency: string;
  capacity: number;
}) {
  const t = getDictionary(locale);
  const reduceMotion = useReducedMotion();
  const [cursor, setCursor] = useState({ x: 50, y: 40 });

  useEffect(() => {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (event: MouseEvent) => {
      setCursor({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion]);

  return (
    <section className="relative isolate flex min-h-screen items-center overflow-hidden bg-void">
      <HeroVilla />
      {!reduceMotion ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-50"
          style={{
            background: `radial-gradient(420px circle at ${cursor.x}% ${cursor.y}%, rgba(160,0,21,0.18), transparent 50%)`,
          }}
        />
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 pb-16 pt-32 text-center">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="eyebrow"
        >
          {dateLine}
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 flex justify-center"
        >
          <span className="sr-only">{title}</span>
          <BrandMark size="hero" priority className="hero-mark mx-auto object-center" />
        </motion.h1>
        <div className="hero-rule mt-2">
          <p className="hero-rule-text font-serif max-w-2xl text-2xl italic text-mist md:text-3xl">
            {tagline}
          </p>
        </div>

        <div className="mt-12 flex w-full flex-col items-center gap-10 md:flex-row md:items-end md:justify-between">
          <Countdown target={eventDate} label={t.hero.countdownLabel} />
          <div className="space-y-4 md:text-right">
            <Link href="/tickets" className="btn-blood">
              {t.hero.buy}
            </Link>
            <div className="ui-meta flex gap-8 text-xs uppercase text-mist md:justify-end">
              <p>
                {t.hero.limited}
                <span className="mt-1 block text-bone">
                  {capacity} {t.hero.guests}
                </span>
              </p>
              <p>
                {t.hero.price}
                <span className="mt-1 block text-bone">{formatMoney(priceCents, currency)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useSyncExternalStore } from "react";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

let cachedNow = typeof window === "undefined" ? 0 : Date.now();
let intervalId: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  cachedNow = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (
    intervalId == null &&
    typeof window !== "undefined" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    intervalId = window.setInterval(emit, 1000);
  }

  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  return cachedNow;
}

function getServerSnapshot() {
  return Date.now();
}

export function Countdown({ target, label }: { target: string; label: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const targetMs = new Date(target).getTime();
  const clock = now > 0 ? now : Date.now();
  const remaining = Math.max(0, targetMs - clock);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  return (
    <div>
      <p className="eyebrow mb-4">{label}</p>
      <div
        className="flex gap-5 font-display text-4xl tracking-[0.08em] md:text-5xl"
        suppressHydrationWarning
      >
        {[
          [pad(days), "D"],
          [pad(hours), "H"],
          [pad(minutes), "M"],
          [pad(seconds), "S"],
        ].map(([value, unit]) => (
          <div key={unit} className="count-cell">
            <div suppressHydrationWarning>{value}</div>
            <div className="mt-1 text-[0.65rem] tracking-[0.16em] text-mist">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

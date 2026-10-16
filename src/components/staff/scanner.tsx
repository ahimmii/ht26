"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";

type ScanResponse = {
  outcome: "VALID" | "ALREADY_USED" | "INVALID" | "DENIED";
  reason?: string;
  holderName?: string;
  publicCode?: string;
  checkedInAt?: string;
  orderReference?: string;
};

type ScannerHandle = {
  pause: (shouldPauseVideo?: boolean) => void;
  resume: () => void;
  clear: () => Promise<void>;
};

const SAME_CODE_MS = 15_000;
const RESUME_MS = 1_600;

function scanKey(payload: { token?: string; publicCode?: string }) {
  return (payload.token ?? payload.publicCode ?? "").trim().toLowerCase();
}

export function StaffScanner({ staffName }: { staffName: string }) {
  const mount = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<ScannerHandle | null>(null);
  const lockRef = useRef(false);
  const lastKeyRef = useRef("");
  const lastAtRef = useRef(0);
  const resumeTimer = useRef<number | null>(null);
  const verifyRef = useRef<(payload: { token?: string; publicCode?: string }) => void>(
    () => undefined,
  );
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [busy, setBusy] = useState(false);

  function pauseCamera() {
    try {
      scannerRef.current?.pause(true);
    } catch {
      // Camera may not have started yet.
    }
  }

  function resumeCamera() {
    try {
      scannerRef.current?.resume();
    } catch {
      // Already running or torn down.
    }
  }

  function releaseAfterHold() {
    if (resumeTimer.current != null) {
      window.clearTimeout(resumeTimer.current);
    }
    resumeTimer.current = window.setTimeout(() => {
      lockRef.current = false;
      resumeCamera();
      resumeTimer.current = null;
    }, RESUME_MS);
  }

  async function verify(payload: { token?: string; publicCode?: string }) {
    const key = scanKey(payload);
    if (!key) return;

    const now = Date.now();
    if (lockRef.current) return;
    if (key === lastKeyRef.current && now - lastAtRef.current < SAME_CODE_MS) return;

    lockRef.current = true;
    lastKeyRef.current = key;
    lastAtRef.current = now;
    pauseCamera();
    setBusy(true);

    try {
      const response = await fetch("/api/staff/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as ScanResponse & { error?: string };
      setResult(
        response.ok
          ? data
          : { outcome: "INVALID", reason: data.error ?? "Scan failed" },
      );
    } catch {
      lastKeyRef.current = "";
      setResult({ outcome: "INVALID", reason: "Scan failed" });
    } finally {
      setBusy(false);
      releaseAfterHold();
    }
  }

  verifyRef.current = verify;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (cancelled || !mount.current) return;
      const instance = new Html5QrcodeScanner(
        "ht-scanner",
        { fps: 8, qrbox: 240, rememberLastUsedCamera: true },
        false,
      );
      instance.render(
        (text) => {
          const token = text.includes("token=")
            ? new URL(text, window.location.origin).searchParams.get("token") ?? text
            : text;
          verifyRef.current({ token });
        },
        () => undefined,
      );
      scannerRef.current = instance;
    }

    void start();
    return () => {
      cancelled = true;
      if (resumeTimer.current != null) window.clearTimeout(resumeTimer.current);
      void scannerRef.current?.clear();
    };
  }, []);

  const tone =
    result?.outcome === "VALID"
      ? "bg-emerald-700"
      : result
        ? "bg-blood"
        : "bg-ash";

  return (
    <main className="min-h-screen px-5 py-8">
      <BrandMark size="header" />
      <p className="eyebrow mt-6">Door · {staffName}</p>
      <h1 className="font-serif mt-3 text-4xl">Scanner</h1>
      <div id="ht-scanner" ref={mount} className="mx-auto mt-8 max-w-md" />
      <form
        className="mx-auto mt-8 flex max-w-md gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void verify({ publicCode: manual.toUpperCase() });
        }}
      >
        <input
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          placeholder="HT-XXXXXX"
          className="input-dark"
        />
        <button className="btn-ghost" disabled={busy}>
          Lookup
        </button>
      </form>
      <div className={`mx-auto mt-8 max-w-md p-8 text-center ${tone}`}>
        <p className="font-display text-3xl tracking-[0.08em]">
          {result?.outcome ?? "READY"}
        </p>
        <p className="mt-3 text-lg">{result?.holderName}</p>
        <p className="text-sm opacity-80">{result?.publicCode}</p>
        <p className="mt-2 text-sm">{result?.reason}</p>
        {result?.checkedInAt ? (
          <p className="mt-2 text-xs uppercase tracking-[0.08em]">
            {new Date(result.checkedInAt).toLocaleString()}
          </p>
        ) : null}
        {result ? (
          <p className="mt-4 text-xs uppercase tracking-[0.08em] text-bone/70">
            Aim the next ticket at the camera
          </p>
        ) : null}
      </div>
    </main>
  );
}

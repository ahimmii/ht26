"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loginAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/ui/brand-mark";

function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  return (
    <form action={action} className="w-full max-w-sm space-y-6">
      <BrandMark size="compact" priority />
      <p className="eyebrow">Staff access</p>
      <h1 className="font-serif text-4xl">Enter</h1>
      <input type="hidden" name="next" value={next} />
      <input name="email" type="email" required placeholder="Email" className="input-dark" />
      <input name="password" type="password" required placeholder="Password" className="input-dark" />
      {state?.error ? <p className="text-blood">{state.error}</p> : null}
      <button className="btn-blood w-full" disabled={pending}>
        Sign in
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}

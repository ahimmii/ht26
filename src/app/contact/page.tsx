"use client";

import { useActionState } from "react";
import { contactAction } from "@/app/actions/contact";

export default function ContactPage() {
  const [state, action, pending] = useActionState(contactAction, undefined);

  return (
    <main className="mx-auto max-w-xl px-5 pb-24 pt-32">
      <p className="eyebrow">Contact</p>
      <h1 className="font-serif mt-4 text-5xl">Write to the house</h1>
      <form action={action} className="mt-10 space-y-6">
        <input name="name" required placeholder="Name" className="input-dark" />
        <input name="email" type="email" required placeholder="Email" className="input-dark" />
        <textarea name="message" required rows={6} placeholder="Message" className="input-dark" />
        {state && "error" in state ? <p className="text-blood">{state.error}</p> : null}
        {state && "ok" in state ? <p className="text-mist">Message received.</p> : null}
        <button className="btn-blood" disabled={pending}>
          Send
        </button>
      </form>
    </main>
  );
}

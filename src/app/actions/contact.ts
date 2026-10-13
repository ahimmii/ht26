"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactNotification } from "@/server/email";

export async function contactAction(_: unknown, formData: FormData) {
  const ip = getClientIp(await headers());
  const limited = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limited.ok) {
    return { error: "Too many messages. Please try later." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message" };
  }

  await prisma.contactMessage.create({ data: parsed.data });
  await sendContactNotification(parsed.data);
  return { ok: true };
}

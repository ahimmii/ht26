import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/utils";
import { verifyCmiCallback } from "@/server/payments/cmi";
import { confirmPaidOrder, markOrderFailed } from "@/server/orders";

function formToRecord(form: FormData) {
  const record: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") record[key] = value;
  }
  return record;
}

export async function POST(request: Request) {
  const payload = formToRecord(await request.formData());
  const verification = verifyCmiCallback(payload);

  if (!verification.ok) {
    if (payload.oid) {
      await markOrderFailed(payload.oid, verification.reason);
    }
    return new NextResponse("FAILURE", { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { reference: verification.orderReference },
  });
  if (!order) {
    return new NextResponse("FAILURE", { status: 404 });
  }

  await prisma.paymentEvent.create({
    data: {
      orderId: order.id,
      provider: "CMI",
      type: "callback",
      payloadHash: sha256(JSON.stringify({ oid: payload.oid, TransId: payload.TransId })),
      success: true,
    },
  });

  await confirmPaidOrder({
    orderId: order.id,
    source: "cmi_callback",
    externalId: verification.externalId,
  });

  return new NextResponse("APPROVED", { status: 200 });
}

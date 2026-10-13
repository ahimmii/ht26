import { NextResponse } from "next/server";
import { promoValidateSchema } from "@/lib/validations";
import { getEventSettings } from "@/server/event";
import { assertPromoUsable, findActivePromo, priceWithPromo } from "@/server/promo";
import { PromoError } from "@/server/promo";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = promoValidateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid promo request" }, { status: 400 });
  }

  const promo = await findActivePromo(parsed.data.code);
  if (!promo) {
    return NextResponse.json({ error: "This promo code is not valid" }, { status: 404 });
  }

  try {
    await assertPromoUsable(promo, parsed.data.email);
    const event = await getEventSettings();
    const quantity = parsed.data.quantity ?? 1;
    const pricing = priceWithPromo(event.ticketPriceCents, quantity, promo);
    return NextResponse.json({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      ...pricing,
    });
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}

import { NextResponse } from "next/server";
import { getEventAvailability } from "@/server/event";

export async function GET() {
  const availability = await getEventAvailability();
  return NextResponse.json({
    remaining: availability.remaining,
    reserved: availability.reserved,
    confirmed: availability.confirmed,
    capacity: availability.event.capacity,
    priceCents: availability.event.ticketPriceCents,
    currency: availability.event.currency,
    salesOpen: availability.salesOpen,
    soldOut: availability.soldOut,
  });
}

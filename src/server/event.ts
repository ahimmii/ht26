import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { availableTickets } from "./inventory";

export async function getEventSettings() {
  await connection();
  const event = await prisma.eventSettings.findUnique({
    where: { id: "default" },
  });
  if (!event) {
    throw new Error("Event settings are missing. Run prisma db seed.");
  }
  return event;
}

export async function getEventAvailability() {
  const event = await getEventSettings();
  const remaining = availableTickets(event);
  const now = new Date();
  return {
    event,
    remaining,
    reserved: event.reservedCount,
    confirmed: event.confirmedCount,
    salesOpen: now >= event.salesOpenAt && now <= event.salesCloseAt,
    soldOut: remaining <= 0,
  };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { scanSchema } from "@/lib/validations";
import { getClientIp } from "@/lib/utils";
import { requireApiRole } from "@/server/require-auth";
import { checkInTicket } from "@/server/tickets";
import { writeAuditLog } from "@/server/audit";

export async function POST(request: Request) {
  const user = await requireApiRole(["ADMIN", "STAFF"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  const limited = rateLimit(`scan:${user.id}:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(rateLimitResponse(limited.resetAt), { status: 429 });
  }

  const parsed = scanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.token && !parsed.data.publicCode)) {
    return NextResponse.json({ error: "Provide a ticket token or code" }, { status: 400 });
  }

  const result = await prisma.$transaction((tx) =>
    checkInTicket(tx, {
      token: parsed.data.token,
      publicCode: parsed.data.publicCode,
      staffId: user.id,
    }),
  );

  await writeAuditLog({
    actorId: user.id,
    action: "CHECK_IN",
    entity: "Ticket",
    entityId: "ticketId" in result ? result.ticketId : parsed.data.publicCode,
    metadata: { outcome: result.outcome },
    ip,
  });

  return NextResponse.json(result);
}

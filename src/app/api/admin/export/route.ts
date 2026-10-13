import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { csvEscape, getClientIp } from "@/lib/utils";
import { requireApiRole } from "@/server/require-auth";
import { writeAuditLog } from "@/server/audit";

export async function GET(request: Request) {
  const user = await requireApiRole(["ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { tickets: true, promoCode: true },
  });

  const header = [
    "reference",
    "status",
    "customerName",
    "email",
    "phone",
    "quantity",
    "totalCents",
    "paymentMethod",
    "promo",
    "ambassador",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "createdAt",
    "paidAt",
  ];

  const rows = orders.map((order) =>
    [
      order.reference,
      order.status,
      order.customerName,
      order.email,
      order.phone,
      order.quantity,
      order.totalCents,
      order.paymentMethod,
      order.promoCode?.code ?? "",
      order.ambassadorCode ?? "",
      order.utmSource ?? "",
      order.utmMedium ?? "",
      order.utmCampaign ?? "",
      order.createdAt.toISOString(),
      order.paidAt?.toISOString() ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );

  await writeAuditLog({
    actorId: user.id,
    action: "EXPORT_REPORT",
    entity: "Order",
    ip: getClientIp(request.headers),
  });

  return new NextResponse([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=halloween-tangier-sales.csv",
    },
  });
}

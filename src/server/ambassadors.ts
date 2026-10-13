import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export async function recordCampaignVisit(input: {
  ambassadorCode?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  path: string;
}) {
  const ambassador = input.ambassadorCode
    ? await prisma.ambassador.findFirst({
        where: { code: input.ambassadorCode.toUpperCase(), active: true },
      })
    : null;

  await prisma.campaignVisit.create({
    data: {
      ambassadorId: ambassador?.id,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      path: input.path.slice(0, 200),
    },
  });
}

export async function getAmbassadorStats() {
  await connection();
  const ambassadors = await prisma.ambassador.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { visits: true } } },
  });

  const orders = await prisma.order.groupBy({
    by: ["ambassadorCode", "status"],
    _count: { _all: true },
    _sum: { totalCents: true, quantity: true },
    where: { ambassadorCode: { not: null } },
  });

  return ambassadors.map((ambassador) => {
    const related = orders.filter((row) => row.ambassadorCode === ambassador.code);
    const paid = related.filter((row) => row.status === "PAID");
    return {
      ...ambassador,
      visits: ambassador._count.visits,
      orders: related.reduce((sum, row) => sum + row._count._all, 0),
      paidTickets: paid.reduce((sum, row) => sum + (row._sum.quantity ?? 0), 0),
      revenueCents: paid.reduce((sum, row) => sum + (row._sum.totalCents ?? 0), 0),
    };
  });
}

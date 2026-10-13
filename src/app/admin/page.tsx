import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { getEventAvailability } from "@/server/event";

export const instant = false;

export default async function AdminOverviewPage() {
  const { event, remaining, reserved, confirmed } = await getEventAvailability();
  const [paid, pending, checkedIn, daily] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalCents: true, quantity: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["PENDING", "PENDING_VERIFICATION"] } },
      _sum: { totalCents: true, quantity: true },
    }),
    prisma.ticket.count({ where: { status: "USED" } }),
    prisma.$queryRaw<Array<{ day: Date; tickets: number }>>`
      SELECT date_trunc('day', "paidAt") as day, SUM(quantity)::int as tickets
      FROM "Order"
      WHERE status = 'PAID' AND "paidAt" IS NOT NULL
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 14
    `,
  ]);

  const stats = [
    ["Capacity", String(event.capacity)],
    ["Confirmed", String(confirmed)],
    ["Available", String(remaining)],
    ["Reserved", String(reserved)],
    ["Revenue", formatMoney(paid._sum.totalCents ?? 0, event.currency)],
    ["Pending", formatMoney(pending._sum.totalCents ?? 0, event.currency)],
    ["Checked in", String(checkedIn)],
  ];

  return (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="font-serif mt-3 text-4xl">{event.title}</h1>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="border-t border-white/10 pt-4">
            <p className="eyebrow">{label}</p>
            <p className="font-serif mt-3 text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-16">
        <p className="eyebrow">Daily paid tickets</p>
        <ul className="mt-6 space-y-3 text-mist">
          {daily.length === 0 ? <li>No paid tickets yet.</li> : null}
          {daily.map((row) => (
            <li key={String(row.day)} className="flex justify-between border-t border-white/10 pt-3">
              <span>{new Date(row.day).toISOString().slice(0, 10)}</span>
              <span>{row.tickets}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

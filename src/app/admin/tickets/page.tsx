import { revokeTicketAction } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const tickets = await prisma.ticket.findMany({
    where: q
      ? {
          OR: [
            { publicCode: { contains: q, mode: "insensitive" } },
            { holderName: { contains: q, mode: "insensitive" } },
            { order: { reference: { contains: q, mode: "insensitive" } } },
            { order: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { order: true, checkIns: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <p className="eyebrow">Tickets</p>
      <h1 className="font-serif mt-3 text-4xl">Door list</h1>
      <form className="mt-8">
        <input name="q" defaultValue={q} placeholder="Search ticket, guest, order" className="input-dark max-w-md" />
      </form>
      <ul className="mt-10 space-y-6">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display tracking-[0.18em]">{ticket.publicCode}</p>
                <p className="mt-2">{ticket.holderName}</p>
                <p className="text-sm text-mist">
                  {ticket.order.reference} · {ticket.status}
                  {ticket.checkedInAt ? ` · in ${ticket.checkedInAt.toISOString()}` : ""}
                </p>
              </div>
              {ticket.status === "VALID" ? (
                <form action={revokeTicketAction.bind(null, ticket.id)}>
                  <button className="btn-ghost">Revoke</button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

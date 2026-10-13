import { cancelOrderAction, refundOrderAction, resendTicketsAction, verifyOrderAction } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export const instant = false;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const orders = await prisma.order.findMany({
    where: q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Orders</p>
          <h1 className="font-serif mt-3 text-4xl">Sales desk</h1>
        </div>
        <a href="/api/admin/export" className="btn-ghost">
          Export CSV
        </a>
      </div>
      <form className="mt-8">
        <input name="q" defaultValue={q} placeholder="Search name, email, reference" className="input-dark max-w-md" />
      </form>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="eyebrow text-mist">
            <tr>
              <th className="pb-3">Ref</th>
              <th className="pb-3">Guest</th>
              <th className="pb-3">Qty</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-white/10">
                <td className="py-4">{order.reference}</td>
                <td className="py-4">
                  {order.customerName}
                  <div className="text-mist">{order.email}</div>
                </td>
                <td className="py-4">{order.quantity}</td>
                <td className="py-4">{formatMoney(order.totalCents)}</td>
                <td className="py-4">{order.status}</td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-2">
                    {order.status === "PENDING_VERIFICATION" || order.status === "PENDING" ? (
                      <form action={verifyOrderAction.bind(null, order.id)}>
                        <button className="btn-blood px-3 py-2">Verify</button>
                      </form>
                    ) : null}
                    {order.status === "PAID" ? (
                      <>
                        <form action={resendTicketsAction.bind(null, order.id)}>
                          <button className="btn-ghost px-3 py-2">Resend</button>
                        </form>
                        <form action={refundOrderAction.bind(null, order.id)}>
                          <button className="btn-ghost px-3 py-2">Refund</button>
                        </form>
                      </>
                    ) : null}
                    {order.status !== "CANCELLED" && order.status !== "REFUNDED" ? (
                      <form action={cancelOrderAction.bind(null, order.id)}>
                        <button className="btn-ghost px-3 py-2">Cancel</button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

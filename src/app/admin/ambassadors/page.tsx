import { formatMoney } from "@/lib/money";
import { getAmbassadorStats } from "@/server/ambassadors";

export const instant = false;

export default async function AdminAmbassadorsPage() {
  const stats = await getAmbassadorStats();

  return (
    <div>
      <p className="eyebrow">Ambassadors</p>
      <h1 className="font-serif mt-3 text-4xl">Campaigns</h1>
      <p className="mt-3 text-mist">Use ?ref=HALLO01 or UTM parameters on campaign links.</p>
      <div className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="eyebrow text-mist">
            <tr>
              <th className="pb-3">Code</th>
              <th className="pb-3">Visits</th>
              <th className="pb-3">Orders</th>
              <th className="pb-3">Paid tickets</th>
              <th className="pb-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="py-4">{row.code}</td>
                <td className="py-4">{row.visits}</td>
                <td className="py-4">{row.orders}</td>
                <td className="py-4">{row.paidTickets}</td>
                <td className="py-4">{formatMoney(row.revenueCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

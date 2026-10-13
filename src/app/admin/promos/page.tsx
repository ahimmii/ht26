import { savePromoAction } from "@/app/actions/admin";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminPromosPage() {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="grid gap-16 md:grid-cols-[1fr_280px]">
      <div>
        <p className="eyebrow">Promo codes</p>
        <h1 className="font-serif mt-3 text-4xl">Discounts</h1>
        <ul className="mt-10 space-y-4">
          {promos.map((promo) => (
            <li key={promo.id} className="border-t border-white/10 pt-4">
              <p className="font-display tracking-[0.16em]">{promo.code}</p>
              <p className="text-sm text-mist">
                {promo.type} {promo.value} · used {promo.usedCount}
                {promo.usageLimit ? `/${promo.usageLimit}` : ""} · {promo.active ? "active" : "off"}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <form action={savePromoAction} className="space-y-4">
        <input name="code" placeholder="CODE" className="input-dark" required />
        <select name="type" className="input-dark bg-void">
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed (centimes)</option>
        </select>
        <input name="value" type="number" placeholder="Value" className="input-dark" required />
        <input name="expiresAt" type="datetime-local" className="input-dark" />
        <input name="usageLimit" type="number" placeholder="Usage limit" className="input-dark" />
        <input name="perCustomerLimit" type="number" defaultValue={1} className="input-dark" />
        <label className="flex items-center gap-2 text-sm text-mist">
          <input type="checkbox" name="active" defaultChecked /> Active
        </label>
        <button className="btn-blood w-full">Save promo</button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/ui/brand-mark";
import { requireRole } from "@/server/require-auth";

export const instant = false;

const links = [
  ["Overview", "/admin"],
  ["Orders", "/admin/orders"],
  ["Tickets", "/admin/tickets"],
  ["Settings", "/admin/settings"],
  ["Promos", "/admin/promos"],
  ["Ambassadors", "/admin/ambassadors"],
  ["Audit", "/admin/audit"],
  ["Scanner", "/staff/scanner"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ADMIN"]);

  return (
    <div className="min-h-screen bg-void">
      <aside className="border-b border-white/10 px-5 py-5 md:fixed md:inset-y-0 md:w-56 md:border-b-0 md:border-r">
        <Link href="/" aria-label="Halloweenn Tangier 2026">
          <BrandMark size="header" />
        </Link>
        <p className="eyebrow mt-5">Admin</p>
        <p className="mt-3 text-sm text-mist">{user.email}</p>
        <nav className="mt-8 flex flex-wrap gap-4 md:flex-col">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-xs uppercase tracking-[0.22em] text-mist hover:text-bone">
              {label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-8">
          <button className="text-xs uppercase tracking-[0.22em] text-blood">Sign out</button>
        </form>
      </aside>
      <div className="px-5 py-8 md:pl-64">{children}</div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { actor: true },
    take: 150,
  });

  return (
    <div>
      <p className="eyebrow">Audit</p>
      <h1 className="font-serif mt-3 text-4xl">Activity</h1>
      <ul className="mt-10 space-y-4">
        {logs.map((log) => (
          <li key={log.id} className="border-t border-white/10 pt-3 text-sm">
            <p>
              {log.action} · {log.entity} {log.entityId}
            </p>
            <p className="text-mist">
              {log.actor?.email ?? "system"} · {log.createdAt.toISOString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

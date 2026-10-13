import { StaffScanner } from "@/components/staff/scanner";
import { requireRole } from "@/server/require-auth";

export const instant = false;

export default async function ScannerPage() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  return <StaffScanner staffName={user.name ?? "Staff"} />;
}

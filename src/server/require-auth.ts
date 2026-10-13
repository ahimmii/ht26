import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireRole(roles: Role[]) {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) {
    redirect("/login");
  }
  return user;
}

export async function requireApiRole(roles: Role[]) {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) {
    return null;
  }
  return user;
}

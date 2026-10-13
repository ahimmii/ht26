import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { expireUnpaidOrders } from "@/server/orders";

export async function POST(request: Request) {
  const secret = getCronSecret();
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireUnpaidOrders();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return POST(request);
}

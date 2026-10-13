import { NextResponse } from "next/server";
import { recordCampaignVisit } from "@/server/ambassadors";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.path !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordCampaignVisit({
    ambassadorCode: typeof body.ambassadorCode === "string" ? body.ambassadorCode : undefined,
    utmSource: typeof body.utmSource === "string" ? body.utmSource : undefined,
    utmMedium: typeof body.utmMedium === "string" ? body.utmMedium : undefined,
    utmCampaign: typeof body.utmCampaign === "string" ? body.utmCampaign : undefined,
    path: body.path,
  });

  return NextResponse.json({ ok: true });
}

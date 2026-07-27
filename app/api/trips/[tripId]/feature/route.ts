import { NextResponse } from "next/server";
import { setFeaturedTrip } from "@/lib/notion";
import { isAuthed } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const { tripId } = await params;
    await setFeaturedTrip(tripId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

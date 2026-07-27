import { NextResponse } from "next/server";
import { getTrips } from "@/lib/notion";
import { isAuthed } from "@/lib/auth";

export async function GET() {
  if (!isAuthed()) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const trips = await getTrips();
    return NextResponse.json(trips);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

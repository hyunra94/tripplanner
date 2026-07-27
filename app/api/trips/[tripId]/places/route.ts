import { NextResponse } from "next/server";
import { createPlace, getPlaces } from "@/lib/notion";
import { isAuthed } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const { tripId } = await params;
    const places = await getPlaces(tripId);
    return NextResponse.json(places);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const { tripId } = await params;
    const body = await req.json();
    const id = await createPlace(tripId, body);
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

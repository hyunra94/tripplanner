import { NextResponse } from "next/server";
import { createPackingItem, getPackingItems } from "@/lib/notion";
import { isAuthed } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  if (!isAuthed()) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const items = await getPackingItems(params.tripId);
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  if (!isAuthed()) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const { name } = await req.json();
    const id = await createPackingItem(params.tripId, name);
    return NextResponse.json({ id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

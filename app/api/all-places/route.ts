import { NextResponse } from "next/server";
import { getAllPlaces } from "@/lib/notion";

export async function GET() {
  try {
    const places = await getAllPlaces();
    return NextResponse.json(places);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

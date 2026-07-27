import { NextResponse } from "next/server";
import { getFeaturedTrip, getPlaces, getPackingItems } from "@/lib/notion";

export async function GET() {
  try {
    const trip = await getFeaturedTrip();
    if (!trip) {
      return NextResponse.json({ trip: null, places: [], packingItems: [] });
    }
    const [places, packingItems] = await Promise.all([
      getPlaces(trip.id),
      getPackingItems(trip.id).catch(() => []),
    ]);
    return NextResponse.json({ trip, places, packingItems });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

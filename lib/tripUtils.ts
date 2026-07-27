import type { Place } from "@/types";

export type DayBucket = { key: string; label: string; places: Place[] };

export function groupByDay(places: Place[]): DayBucket[] {
  const byDate = new Map<string, Place[]>();
  const unassigned: Place[] = [];

  for (const p of places) {
    if (!p.visitDate) {
      unassigned.push(p);
      continue;
    }
    const key = p.visitDate.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(p);
  }

  const sortedKeys = [...byDate.keys()].sort();
  const days: DayBucket[] = sortedKeys.map((key, i) => ({
    key,
    label: `DAY ${i + 1}`,
    places: [...byDate.get(key)!].sort((a, b) =>
      (a.visitDate ?? "").localeCompare(b.visitDate ?? "")
    ),
  }));

  if (unassigned.length > 0) {
    days.push({ key: "unassigned", label: "날짜 미정", places: unassigned });
  }

  return days;
}

export function formatDateKo(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, ".");
}

export function computeDDay(dateIso: string | null): string | null {
  if (!dateIso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateIso);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

export const TRIP_PHOTOS = [
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=500&q=70",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=70",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=500&q=70",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=70",
];

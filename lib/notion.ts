import { Client } from "@notionhq/client";
import type { Trip, Place, PackingItem } from "@/types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TRIPS_DB_ID = process.env.NOTION_TRIPS_DB_ID!;
const TRAVEL_DB_ID = process.env.NOTION_TRAVEL_DB_ID!;

function titleOf(prop: any): string {
  return prop?.title?.map((t: any) => t.plain_text).join("") ?? "";
}

function textOf(prop: any): string {
  return prop?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
}

export async function getTrips(): Promise<Trip[]> {
  const res = await notion.databases.query({
    database_id: TRIPS_DB_ID,
    sorts: [{ property: "날짜", direction: "descending" }],
  });
  return res.results.map((page: any) => ({
    id: page.id,
    title: titleOf(page.properties["제목"]),
    place: textOf(page.properties["장소"]),
    date: page.properties["날짜"]?.date?.start ?? null,
  }));
}

const packingDbCache = new Map<string, string>();

async function findPackingDbId(blockId: string, depth = 0): Promise<string | null> {
  if (depth > 4) return null;
  const children = await notion.blocks.children.list({ block_id: blockId });
  for (const block of children.results as any[]) {
    if (
      block.type === "child_database" &&
      block.child_database?.title?.includes("준비물")
    ) {
      return block.id;
    }
    if (block.type === "column_list" || block.type === "column") {
      const found = await findPackingDbId(block.id, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export async function getPackingDbId(tripPageId: string): Promise<string> {
  const cached = packingDbCache.get(tripPageId);
  if (cached) return cached;
  const id = await findPackingDbId(tripPageId);
  if (!id) throw new Error("이 여행에서 준비물 DB를 찾을 수 없습니다.");
  packingDbCache.set(tripPageId, id);
  return id;
}

function mapPlacePage(page: any): Place {
  const p = page.properties;
  return {
    id: page.id,
    name: titleOf(p["장소명"]),
    address: textOf(p["주소"]),
    lat: p["위도"]?.number ?? null,
    lng: p["경도"]?.number ?? null,
    memo: textOf(p["메모"]),
    visitDate: p["방문일"]?.date?.start ?? null,
  };
}

export async function getPlaces(tripPageId: string): Promise<Place[]> {
  const res = await notion.databases.query({
    database_id: TRAVEL_DB_ID,
    filter: {
      and: [
        { property: "여행플래너 표시", checkbox: { equals: true } },
        { property: "여행명", relation: { contains: tripPageId } },
      ],
    },
  });
  return res.results
    .map(mapPlacePage)
    .filter((p): p is Place => p.lat != null && p.lng != null);
}

export async function getAllPlaces(): Promise<Place[]> {
  const res = await notion.databases.query({
    database_id: TRAVEL_DB_ID,
    filter: { property: "여행플래너 표시", checkbox: { equals: true } },
  });
  return res.results
    .map(mapPlacePage)
    .filter((p): p is Place => p.lat != null && p.lng != null);
}

function dayDiff(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateIso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export async function getFeaturedTrip(): Promise<Trip | null> {
  const res = await notion.databases.query({ database_id: TRIPS_DB_ID });
  const items = res.results.map((page: any) => ({
    id: page.id,
    title: titleOf(page.properties["제목"]),
    place: textOf(page.properties["장소"]),
    date: page.properties["날짜"]?.date?.start ?? null,
    featured: page.properties["대시보드 표시"]?.checkbox ?? false,
  }));
  if (items.length === 0) return null;

  const pinned = items.find((t) => t.featured);
  if (pinned) return pinned;

  const dated = items.filter((t) => t.date);
  const future = dated
    .map((t) => ({ ...t, diff: dayDiff(t.date as string) }))
    .filter((t) => t.diff >= 0)
    .sort((a, b) => a.diff - b.diff);
  if (future.length > 0) return future[0];

  const past = dated
    .map((t) => ({ ...t, diff: dayDiff(t.date as string) }))
    .sort((a, b) => b.diff - a.diff);
  if (past.length > 0) return past[0];

  return items[0];
}

export async function setFeaturedTrip(tripId: string): Promise<void> {
  const res = await notion.databases.query({
    database_id: TRIPS_DB_ID,
    filter: { property: "대시보드 표시", checkbox: { equals: true } },
  });
  await Promise.all(
    res.results
      .filter((p: any) => p.id !== tripId)
      .map((p: any) =>
        notion.pages.update({
          page_id: p.id,
          properties: { "대시보드 표시": { checkbox: false } },
        })
      )
  );
  await notion.pages.update({
    page_id: tripId,
    properties: { "대시보드 표시": { checkbox: true } },
  });
}

export async function createPlace(
  tripPageId: string,
  data: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
    memo?: string;
    visitDate?: string | null;
  }
): Promise<string> {
  const page = await notion.pages.create({
    parent: { database_id: TRAVEL_DB_ID },
    properties: {
      장소명: { title: [{ text: { content: data.name } }] },
      위도: { number: data.lat },
      경도: { number: data.lng },
      주소: { rich_text: data.address ? [{ text: { content: data.address } }] : [] },
      메모: { rich_text: data.memo ? [{ text: { content: data.memo } }] : [] },
      "여행플래너 표시": { checkbox: true },
      여행명: { relation: [{ id: tripPageId }] },
      ...(data.visitDate ? { 방문일: { date: { start: data.visitDate } } } : {}),
    },
  });
  return page.id;
}

export async function updatePlace(
  placeId: string,
  data: Partial<{ name: string; memo: string; address: string; visitDate: string | null }>
): Promise<void> {
  const properties: any = {};
  if (data.name !== undefined) properties.장소명 = { title: [{ text: { content: data.name } }] };
  if (data.memo !== undefined)
    properties.메모 = { rich_text: data.memo ? [{ text: { content: data.memo } }] : [] };
  if (data.address !== undefined)
    properties.주소 = { rich_text: data.address ? [{ text: { content: data.address } }] : [] };
  if (data.visitDate !== undefined)
    properties.방문일 = data.visitDate ? { date: { start: data.visitDate } } : { date: null };
  await notion.pages.update({ page_id: placeId, properties });
}

export async function deletePlace(placeId: string): Promise<void> {
  await notion.pages.update({ page_id: placeId, archived: true });
}

export async function getPackingItems(tripPageId: string): Promise<PackingItem[]> {
  const dbId = await getPackingDbId(tripPageId);
  const res = await notion.databases.query({ database_id: dbId });
  return res.results.map((page: any) => ({
    id: page.id,
    name: titleOf(page.properties["이름"]),
    done: page.properties["준비 완료"]?.checkbox ?? false,
  }));
}

export async function createPackingItem(tripPageId: string, name: string): Promise<string> {
  const dbId = await getPackingDbId(tripPageId);
  const page = await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      이름: { title: [{ text: { content: name } }] },
    },
  });
  return page.id;
}

export async function togglePackingItem(itemId: string, done: boolean): Promise<void> {
  await notion.pages.update({
    page_id: itemId,
    properties: { "준비 완료": { checkbox: done } },
  });
}

export async function deletePackingItem(itemId: string): Promise<void> {
  await notion.pages.update({ page_id: itemId, archived: true });
}

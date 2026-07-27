import { NextResponse } from "next/server";

type LatLng = { lat: number; lng: number };

async function fetchLeg(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  const url = new URL("https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving");
  url.searchParams.set("start", `${from.lng},${from.lat}`);
  url.searchParams.set("goal", `${to.lng},${to.lat}`);
  url.searchParams.set("option", "trafast");

  const res = await fetch(url, {
    headers: {
      "x-ncp-apigw-api-key-id": process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "",
      "x-ncp-apigw-api-key": process.env.NAVER_MAP_CLIENT_SECRET ?? "",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const path = data?.route?.trafast?.[0]?.path;
  if (!Array.isArray(path)) return null;
  return path.map(([lng, lat]: [number, number]) => ({ lat, lng }));
}

export async function POST(req: Request) {
  const { points }: { points: LatLng[] } = await req.json();
  if (!Array.isArray(points) || points.length < 2) {
    return NextResponse.json({ path: points ?? [] });
  }

  const fullPath: LatLng[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const leg = await fetchLeg(points[i], points[i + 1]);
    if (leg) {
      fullPath.push(...leg);
    } else {
      fullPath.push(points[i + 1]);
    }
  }

  return NextResponse.json({ path: fullPath });
}

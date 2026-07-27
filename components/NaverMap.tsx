"use client";

import { useEffect, useRef, useState } from "react";

export type MapPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
};

type Props = {
  clientId: string;
  places: MapPlace[];
  onMapClick?: (lat: number, lng: number) => void;
  center?: { lat: number; lng: number };
  showRoute?: boolean;
  numbered?: boolean;
};

declare global {
  interface Window {
    naver: any;
  }
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청

export default function NaverMap({
  clientId,
  places,
  onMapClick,
  center,
  showRoute = true,
  numbered = true,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // 네이버 지도 스크립트는 한 번만 로드
  useEffect(() => {
    if (window.naver && window.naver.maps) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-naver-maps="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true));
      existing.addEventListener("error", () => setScriptError(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.dataset.naverMaps = "true";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);
  }, [clientId]);

  // 지도 최초 생성
  useEffect(() => {
    if (!scriptLoaded || !mapDivRef.current || mapRef.current) return;
    const { naver } = window;
    const start = center ?? DEFAULT_CENTER;
    const map = new naver.maps.Map(mapDivRef.current, {
      center: new naver.maps.LatLng(start.lat, start.lng),
      zoom: 13,
    });
    mapRef.current = map;

    naver.maps.Event.addListener(map, "click", (e: any) => {
      onMapClickRef.current?.(e.coord.lat(), e.coord.lng());
    });
  }, [scriptLoaded]);

  // places가 바뀔 때마다 번호 마커 다시 그리기 + 지도 범위 맞추기
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return;
    const { naver } = window;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const sorted = [...places].sort((a, b) => a.order - b.order);

    sorted.forEach((place, idx) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(place.lat, place.lng),
        map,
        title: place.name,
        icon: numbered
          ? {
              content: `<div style="background:#3489ef;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${
                idx + 1
              }</div>`,
              anchor: new naver.maps.Point(13, 13),
            }
          : {
              content: `<div style="width:14px;height:14px;border-radius:50%;background:#3489ef;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
              anchor: new naver.maps.Point(7, 7),
            },
      });
      markersRef.current.push(marker);
    });

    if (sorted.length === 1) {
      map.setCenter(new naver.maps.LatLng(sorted[0].lat, sorted[0].lng));
      map.setZoom(15);
    } else if (sorted.length > 1) {
      const bounds = new naver.maps.LatLngBounds();
      sorted.forEach((p) => bounds.extend(new naver.maps.LatLng(p.lat, p.lng)));
      map.fitBounds(bounds);
    }
  }, [places, scriptLoaded, numbered]);

  // 실제 도로를 따라가는 경로선 (Directions API), 실패 시 직선으로 대체
  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (!scriptLoaded || !mapRef.current || !showRoute) return;
    const { naver } = window;
    const map = mapRef.current;

    const sorted = [...places].sort((a, b) => a.order - b.order);
    if (sorted.length < 2) return;

    let cancelled = false;
    const straight = sorted.map((p) => ({ lat: p.lat, lng: p.lng }));

    const draw = (path: { lat: number; lng: number }[]) => {
      if (cancelled) return;
      polylineRef.current = new naver.maps.Polyline({
        map,
        path: path.map((p) => new naver.maps.LatLng(p.lat, p.lng)),
        strokeColor: "#3489ef",
        strokeWeight: 4,
        strokeOpacity: 0.8,
      });
    };

    fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: straight }),
    })
      .then((r) => r.json())
      .then((data) => draw(Array.isArray(data.path) && data.path.length > 0 ? data.path : straight))
      .catch(() => draw(straight));

    return () => {
      cancelled = true;
    };
  }, [places, scriptLoaded, showRoute]);

  if (scriptError) {
    return (
      <div style={{ padding: 24 }}>
        지도를 불러오지 못했습니다. Client ID 또는 콘솔에 등록한 Web 서비스 URL(
        http://localhost:3000)을 확인해주세요.
      </div>
    );
  }

  return <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />;
}

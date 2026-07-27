"use client";

import { useEffect, useMemo, useState } from "react";
import type { Trip, Place, PackingItem } from "@/types";
import NaverMap, { MapPlace } from "./NaverMap";
import DayTabs from "./DayTabs";
import { groupByDay, formatDateKo, computeDDay } from "@/lib/tripUtils";

type DashboardData = { trip: Trip | null; places: Place[]; packingItems: PackingItem[] };

export default function Dashboard({ clientId }: { clientId: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>("");
  const [mapMode, setMapMode] = useState<"trip" | "all">("trip");
  const [allPlaces, setAllPlaces] = useState<Place[] | null>(null);
  const [showPacking, setShowPacking] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  const places = data?.places ?? [];
  const trip = data?.trip ?? null;
  const packingItems = data?.packingItems ?? [];
  const packingDone = packingItems.filter((i) => i.done).length;

  const days = useMemo(() => groupByDay(places), [places]);

  useEffect(() => {
    if (days.length === 0) {
      setSelectedDayKey("");
      return;
    }
    if (!days.some((d) => d.key === selectedDayKey)) {
      setSelectedDayKey(days[0].key);
    }
  }, [days, selectedDayKey]);

  const currentDay = days.find((d) => d.key === selectedDayKey);
  const currentPlaces = currentDay?.places ?? [];
  const currentDayLabel = currentDay?.label ?? "전체";

  const loadAllPlaces = () => {
    if (allPlaces) return;
    fetch("/api/all-places")
      .then((r) => r.json())
      .then((d) => setAllPlaces(Array.isArray(d) ? d : []))
      .catch(() => setAllPlaces([]));
  };

  const mapPlaces: MapPlace[] =
    mapMode === "all"
      ? (allPlaces ?? []).map((p, i) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, order: i }))
      : currentPlaces.map((p, i) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, order: i + 1 }));

  const dDayLabel = computeDDay(trip?.date ?? null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">✦</div>
          BLUE TRIP
        </div>
        <div className="top-actions">
          <a href="/records" className="soft-btn" style={{ textDecoration: "none" }}>
            여행 기록 →
          </a>
        </div>
      </header>

      <main className="page">
        {error && (
          <div
            style={{
              background: "#fff3f0",
              color: "#b3402f",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              {trip?.place ? `${trip.place}로 떠나는 여행` : "다가오는 여행이 없어요"}
            </span>
            <h1>
              여행의 모든 순간을
              <br />
              하나의 노선으로
            </h1>
            <p>가고 싶은 장소를 담으면 이동 순서와 하루 일정을 한눈에 볼 수 있어요.</p>
          </div>
          {trip && (
            <div className="hero-search">
              <div>
                <label>다가오는 여행</label>
                <strong>{trip.title}</strong>
              </div>
              <a
                href="#route"
                style={{
                  border: 0,
                  background: "var(--blue)",
                  color: "#fff",
                  borderRadius: 17,
                  padding: "0 20px",
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  textDecoration: "none",
                }}
              >
                열기
              </a>
            </div>
          )}
        </section>

        {trip ? (
          <>
            <section className="trip-overview">
              <article className="current-trip">
                <div className="trip-photo">{dDayLabel && <span className="day-badge">{dDayLabel}</span>}</div>
                <div className="trip-info">
                  <h3>{trip.title}</h3>
                  <p>{trip.date ? formatDateKo(trip.date) : "날짜 미정"}</p>
                  <div className="status-row">
                    <span className="status">{trip.place || "장소 미정"}</span>
                    <span className="status">
                      {days.filter((d) => d.key !== "unassigned").length}일 일정
                    </span>
                    <span className="status">{places.length}개 장소</span>
                  </div>
                </div>
              </article>
              <article className="stat-card">
                <div>
                  <h3>{currentDayLabel} 일정</h3>
                  <div className="big">{currentPlaces.length}곳</div>
                  <p>선택한 날짜에 방문할 장소예요.</p>
                </div>
                <div className="mini-stats">
                  <div>
                    <b>{days.filter((d) => d.key !== "unassigned").length}일</b>
                    <span>전체 일정</span>
                  </div>
                  <button
                    onClick={() => setShowPacking((v) => !v)}
                    style={{
                      border: 0,
                      background: showPacking ? "rgba(255,255,255,.32)" : "rgba(255,255,255,.15)",
                      borderRadius: 15,
                      padding: 12,
                      textAlign: "left",
                      color: "#fff",
                    }}
                  >
                    <b>
                      {packingDone}/{packingItems.length}
                    </b>
                    <span>준비물 완료 · 탭해서 보기</span>
                  </button>
                </div>
              </article>
            </section>

            {showPacking && (
              <section className="card" style={{ padding: 20, marginBottom: 10 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 12px" }}>준비물</h3>
                <div style={{ display: "grid", gap: 6 }}>
                  {packingItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 12,
                        background: "#f8fcff",
                        fontSize: 13,
                        color: item.done ? "var(--muted)" : "var(--text)",
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      <span>{item.done ? "✅" : "⬜"}</span>
                      {item.name}
                    </div>
                  ))}
                  {packingItems.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>준비물이 없어요.</p>
                  )}
                </div>
              </section>
            )}

            <div id="route" className="section-head">
              <div>
                <h2>{mapMode === "all" ? "전체 다녀온 장소" : `${currentDayLabel} 여행 노선`}</h2>
                <p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 13 }}>
                  지도와 시간표를 함께 보며 하루 동선을 확인할 수 있어요.
                </p>
              </div>
            </div>

            <div className="route-layout">
              <article className="map-card">
                <div className="map-shell">
                  <NaverMap
                    clientId={clientId}
                    places={mapPlaces}
                    showRoute={mapMode === "trip"}
                    numbered={mapMode === "trip"}
                  />
                  <div className="map-head">
                    <span className="map-chip">
                      {mapMode === "all" ? "전체 장소" : `${trip.place ?? ""} · ${currentDayLabel}`}
                    </span>
                    <button
                      className="map-chip"
                      style={{ border: 0, cursor: "pointer" }}
                      onClick={() => {
                        const next = mapMode === "trip" ? "all" : "trip";
                        if (next === "all") loadAllPlaces();
                        setMapMode(next);
                      }}
                    >
                      {mapMode === "trip" ? "전체 장소 보기" : "이 여행만 보기"}
                    </button>
                  </div>
                </div>
              </article>

              <aside className="schedule-card">
                <div className="schedule-top">
                  <div>
                    <h3>오늘의 일정</h3>
                    <p>{currentPlaces.length}곳 방문 예정</p>
                  </div>
                </div>
                <DayTabs days={days} selected={selectedDayKey} onSelect={setSelectedDayKey} />
                <div className="schedule-list">
                  {currentPlaces.map((p) => (
                    <div key={p.id} className="place">
                      <div className="place-thumb">📍</div>
                      <div>
                        <h4>{p.name}</h4>
                        {p.memo && <p>{p.memo}</p>}
                        <br />
                        <a
                          href={`https://map.naver.com/p/search/${encodeURIComponent(
                            p.name + (p.address ? " " + p.address : "")
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          네이버 지도에서 보기
                        </a>
                      </div>
                      <div />
                    </div>
                  ))}
                  {currentPlaces.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>
                      이 날짜에는 등록된 장소가 없어요.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </>
        ) : (
          !error && (
            <p style={{ color: "var(--muted)" }}>
              아직 표시할 여행이 없어요. "여행 기록"에서 여행을 추가해보세요.
            </p>
          )
        )}
      </main>
    </div>
  );
}

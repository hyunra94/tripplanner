"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Trip, Place, PackingItem } from "@/types";
import NaverMap, { MapPlace } from "./NaverMap";
import DayTabs, { DayGroup } from "./DayTabs";
import ScheduleList from "./ScheduleList";
import PackingList from "./PackingList";
import { PlaceFormValue } from "./PlaceForm";
import { groupByDay, formatDateKo, computeDDay, TRIP_PHOTOS } from "@/lib/tripUtils";

export default function TripPlanner({ clientId }: { clientId: string }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string>("");
  const [addMode, setAddMode] = useState(false);
  const [addingCoord, setAddingCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPacking, setShowPacking] = useState(false);
  const [featuredTripId, setFeaturedTripId] = useState<string | null>(null);
  const routeSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTrips(data);
        if (data.length > 0) setSelectedTripId(data[0].id);
      })
      .catch((e) => setError(e.message));

    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setFeaturedTripId(data.trip?.id ?? null))
      .catch(() => {});
  }, []);

  const handleSetFeatured = async (tripId: string) => {
    setFeaturedTripId(tripId);
    await fetch(`/api/trips/${tripId}/feature`, { method: "POST" });
  };

  const refreshPlaces = (tripId: string) => {
    fetch(`/api/trips/${tripId}/places`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaces(data);
      })
      .catch((e) => setError(e.message));
  };

  const refreshPacking = (tripId: string) => {
    fetch(`/api/trips/${tripId}/packing`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPackingItems(data);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (!selectedTripId) return;
    setAddMode(false);
    setAddingCoord(null);
    setEditingId(null);
    setShowPacking(false);
    refreshPlaces(selectedTripId);
    refreshPacking(selectedTripId);
  }, [selectedTripId]);

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

  const mapPlaces: MapPlace[] = currentPlaces.map((p, i) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    order: i + 1,
  }));

  const defaultVisitDate =
    selectedDayKey && selectedDayKey !== "unassigned" ? `${selectedDayKey}T09:00` : "";

  const handleMapClick = (lat: number, lng: number) => {
    if (!addMode) return;
    setAddingCoord({ lat, lng });
    setAddMode(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("이 브라우저에서는 위치 감지를 지원하지 않아요.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAddingCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddMode(false);
      },
      () => setError("현재 위치를 가져오지 못했어요. 브라우저의 위치 권한을 확인해주세요."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitAdd = async (value: PlaceFormValue) => {
    if (!addingCoord || !selectedTripId) return;
    const res = await fetch(`/api/trips/${selectedTripId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: value.name,
        lat: addingCoord.lat,
        lng: addingCoord.lng,
        memo: value.memo,
        visitDate: value.visitDate || null,
      }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    setAddingCoord(null);
    refreshPlaces(selectedTripId);
  };

  const handleSubmitEdit = async (id: string, value: PlaceFormValue) => {
    const res = await fetch(`/api/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: value.name,
        memo: value.memo,
        visitDate: value.visitDate || null,
      }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    setEditingId(null);
    refreshPlaces(selectedTripId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 장소를 삭제할까요?")) return;
    await fetch(`/api/places/${id}`, { method: "DELETE" });
    refreshPlaces(selectedTripId);
  };

  const handlePackingAdd = async (name: string) => {
    await fetch(`/api/trips/${selectedTripId}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    refreshPacking(selectedTripId);
  };

  const handlePackingToggle = async (id: string, done: boolean) => {
    setPackingItems((items) => items.map((i) => (i.id === id ? { ...i, done } : i)));
    await fetch(`/api/packing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  };

  const handlePackingDelete = async (id: string) => {
    await fetch(`/api/packing/${id}`, { method: "DELETE" });
    refreshPacking(selectedTripId);
  };

  const currentTrip = trips.find((t) => t.id === selectedTripId);
  const currentDayLabel = currentDay?.label ?? "전체";
  const datedDays = days.filter((d) => d.key !== "unassigned");
  const packingDone = packingItems.filter((i) => i.done).length;

  const sortedAllPlaces = useMemo(() => {
    const dated = [...places]
      .filter((p) => p.visitDate)
      .sort((a, b) => (a.visitDate as string).localeCompare(b.visitDate as string));
    const undated = places.filter((p) => !p.visitDate);
    return [...dated, ...undated];
  }, [places]);
  const firstPlace = sortedAllPlaces[0];
  const lastPlace = sortedAllPlaces[sortedAllPlaces.length - 1];

  const dDayLabel = computeDDay(currentTrip?.date ?? null);

  const scrollToRoute = () => routeSectionRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">✦</div>
          BLUE TRIP
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginLeft: 4 }}>
            여행 기록
          </span>
        </div>
        <div className="top-actions">
          <a
            href="/"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--muted)",
              padding: "9px 12px",
            }}
          >
            ← 대시보드
          </a>
          <button
            onClick={async () => {
              await fetch("/api/auth", { method: "DELETE" });
              window.location.href = "/";
            }}
            className="soft-btn"
            style={{ padding: "9px 12px", fontSize: 13 }}
          >
            로그아웃
          </button>
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
              {currentTrip?.place ? `${currentTrip.place}로 떠나는 여행` : "여행을 선택해주세요"}
            </span>
            <h1>
              여행의 모든 순간을
              <br />
              하나의 노선으로
            </h1>
            <p>가고 싶은 장소를 담으면 이동 순서와 하루 일정을 한눈에 볼 수 있어요.</p>
          </div>
          <div className="hero-search">
            <div>
              <label>현재 여행</label>
              <strong>{currentTrip?.title ?? "-"}</strong>
            </div>
            <button onClick={scrollToRoute}>열기</button>
          </div>
        </section>

        <div className="section-head">
          <div>
            <h2>다가오는 여행</h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 13 }}>
              카드를 눌러 여행을 바꿀 수 있어요.
            </p>
          </div>
        </div>

        <div className="trip-scroll">
          {trips.map((t, i) => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              className={`trip-mini${t.id === selectedTripId ? " active" : ""}`}
              onClick={() => setSelectedTripId(t.id)}
            >
              <div
                className="trip-mini-thumb"
                style={{ backgroundImage: `url(${TRIP_PHOTOS[i % TRIP_PHOTOS.length]})` }}
              >
                {computeDDay(t.date) && <span>{computeDDay(t.date)}</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetFeatured(t.id);
                  }}
                  title="대시보드에 표시"
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    border: 0,
                    background: "rgba(255,255,255,.92)",
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    color: t.id === featuredTripId ? "#f5a623" : "#b7c4cf",
                    fontSize: 14,
                    lineHeight: "26px",
                  }}
                >
                  ★
                </button>
              </div>
              <div className="trip-mini-body">
                <h4>{t.title}</h4>
                <p>{t.place || "장소 미정"}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="trip-overview">
          <article className="current-trip">
            <div className="trip-photo">
              {dDayLabel && <span className="day-badge">{dDayLabel}</span>}
            </div>
            <div className="trip-info">
              <h3>{currentTrip?.title ?? "여행을 선택해주세요"}</h3>
              <p>{currentTrip?.date ? formatDateKo(currentTrip.date) : "날짜 미정"}</p>
              <div className="status-row">
                <span className="status">{currentTrip?.place || "장소 미정"}</span>
                <span className="status">{datedDays.length}일 일정</span>
                <span className="status">{places.length}개 장소</span>
              </div>
              {firstPlace && lastPlace && firstPlace !== lastPlace && (
                <div className="route-preview">
                  <div className="route-point">1</div>
                  <div>
                    <strong>{firstPlace.name}</strong>
                    <small>출발 장소</small>
                  </div>
                  <span className="route-arrow">→</span>
                  <div className="route-point">{sortedAllPlaces.length}</div>
                  <div>
                    <strong>{lastPlace.name}</strong>
                    <small>마지막 장소</small>
                  </div>
                </div>
              )}
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
                <b>{datedDays.length}일</b>
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
          <section style={{ marginBottom: 10 }}>
            <PackingList
              items={packingItems}
              onToggle={handlePackingToggle}
              onAdd={handlePackingAdd}
              onDelete={handlePackingDelete}
            />
          </section>
        )}

        <div ref={routeSectionRef} className="section-head">
          <div>
            <h2>{currentDayLabel} 여행 노선</h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 13 }}>
              지도와 시간표를 함께 보며 하루 동선을 확인할 수 있어요.
            </p>
          </div>
        </div>

        <div className="route-layout">
          <article className="map-card">
            <div className="map-shell">
              <NaverMap clientId={clientId} places={mapPlaces} onMapClick={handleMapClick} />
              <div className="map-head">
                <span className="map-chip">
                  {currentTrip?.place ?? ""} · {currentDayLabel}
                </span>
              </div>
              {currentPlaces.length > 0 && (
                <div className="map-summary">
                  <div>
                    <p>
                      <b>{currentPlaces.length}곳</b>
                      <span>방문 장소</span>
                    </p>
                    <p>
                      <b>{currentDayLabel}</b>
                      <span>선택한 날짜</span>
                    </p>
                  </div>
                  <a
                    href={`https://map.naver.com/p/search/${encodeURIComponent(
                      currentPlaces[0].name
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    길 안내
                  </a>
                </div>
              )}
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
            <ScheduleList
              places={currentPlaces}
              addingCoord={addingCoord}
              defaultVisitDate={defaultVisitDate}
              editingId={editingId}
              busy={addMode}
              onStartAddClick={() => setAddMode(true)}
              onUseCurrentLocation={handleUseCurrentLocation}
              onCancelAdd={() => {
                setAddingCoord(null);
                setAddMode(false);
              }}
              onSubmitAdd={handleSubmitAdd}
              onStartEdit={setEditingId}
              onCancelEdit={() => setEditingId(null)}
              onSubmitEdit={handleSubmitEdit}
              onDelete={handleDelete}
            />
          </aside>
        </div>
      </main>

      <nav className="mobile-bottom">
        <button className="active">
          <span>⌂</span>홈
        </button>
        <button onClick={scrollToRoute}>
          <span>⌖</span>노선
        </button>
        <button
          onClick={() => {
            setAddMode(true);
            scrollToRoute();
          }}
        >
          <span>＋</span>추가
        </button>
      </nav>
    </div>
  );
}

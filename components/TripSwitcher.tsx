"use client";

import { useEffect, useRef, useState } from "react";
import type { Trip } from "@/types";

type Props = {
  trips: Trip[];
  selectedTripId: string;
  onSelect: (id: string) => void;
};

export default function TripSwitcher({ trips, selectedTripId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = trips.find((t) => t.id === selectedTripId);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: 0,
          background: "#fff",
          borderRadius: 16,
          padding: "9px 16px",
          fontWeight: 800,
          color: "var(--navy)",
          boxShadow: "0 8px 22px rgba(61, 121, 161, 0.1)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--blue)",
            flexShrink: 0,
          }}
        />
        {current?.title ?? "여행 선택"}
        <span
          style={{
            color: "var(--muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
            fontSize: 11,
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 220,
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 18px 48px rgba(52, 116, 163, 0.22)",
            padding: 8,
            zIndex: 30,
            display: "grid",
            gap: 2,
          }}
        >
          {trips.map((t) => {
            const active = t.id === selectedTripId;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelect(t.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  border: 0,
                  background: active ? "var(--sky)" : "transparent",
                  color: active ? "var(--blue)" : "var(--text)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: active ? 800 : 600,
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                <span>{t.title}</span>
                {t.place && (
                  <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>
                    {t.place}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

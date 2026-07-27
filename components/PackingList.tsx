"use client";

import { useState } from "react";
import type { PackingItem } from "@/types";

type Props = {
  items: PackingItem[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
};

export default function PackingList({ items, onToggle, onAdd, onDelete }: Props) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 16, margin: "0 0 12px" }}>준비물</h3>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {items.map((item) => (
          <label
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 12,
              background: "#f8fcff",
            }}
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) => onToggle(item.id, e.target.checked)}
            />
            <span
              style={{
                flex: 1,
                fontSize: 13,
                textDecoration: item.done ? "line-through" : "none",
                color: item.done ? "var(--muted)" : "var(--text)",
              }}
            >
              {item.name}
            </span>
            <button
              onClick={() => onDelete(item.id)}
              style={{ border: 0, background: "none", color: "#d96b6b", fontSize: 11 }}
            >
              삭제
            </button>
          </label>
        ))}
        {items.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted)" }}>아직 준비물이 없어요.</p>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="준비물 추가"
          style={{ flex: 1, padding: 8, borderRadius: 10, border: "1px solid var(--line)" }}
        />
        <button className="primary-btn" onClick={submit}>
          추가
        </button>
      </div>
    </div>
  );
}

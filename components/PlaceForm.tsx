"use client";

import { useState } from "react";

export type PlaceFormValue = {
  name: string;
  visitDate: string; // datetime-local string, may be ""
  memo: string;
};

type Props = {
  title: string;
  initial: PlaceFormValue;
  submitLabel: string;
  onSubmit: (value: PlaceFormValue) => void | Promise<void>;
  onCancel: () => void;
};

export default function PlaceForm({ title, initial, submitLabel, onSubmit, onCancel }: Props) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!value.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="place-form">
      <strong style={{ fontSize: 13, color: "var(--navy)" }}>{title}</strong>
      <input
        placeholder="장소 이름"
        value={value.name}
        onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))}
      />
      <input
        type="datetime-local"
        value={value.visitDate}
        onChange={(e) => setValue((v) => ({ ...v, visitDate: e.target.value }))}
      />
      <textarea
        placeholder="메모"
        value={value.memo}
        onChange={(e) => setValue((v) => ({ ...v, memo: e.target.value }))}
        rows={2}
        style={{ resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="primary-btn" onClick={submit} disabled={saving} style={{ flex: 1 }}>
          {saving ? "저장 중..." : submitLabel}
        </button>
        <button
          onClick={onCancel}
          style={{
            border: 0,
            background: "#eef4f8",
            color: "#6d8498",
            borderRadius: 14,
            padding: "10px 14px",
            fontWeight: 700,
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

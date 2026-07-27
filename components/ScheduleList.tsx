"use client";

import type { Place } from "@/types";
import PlaceForm, { PlaceFormValue } from "./PlaceForm";

function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.length >= 16 ? iso.slice(0, 16) : iso;
}

function formatTime(iso: string | null): string {
  if (!iso || iso.length < 16) return "";
  return iso.slice(11, 16);
}

type Props = {
  places: Place[];
  addingCoord: { lat: number; lng: number } | null;
  defaultVisitDate: string;
  editingId: string | null;
  busy: boolean;
  onStartAddClick: () => void;
  onUseCurrentLocation: () => void;
  onCancelAdd: () => void;
  onSubmitAdd: (value: PlaceFormValue) => void | Promise<void>;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (id: string, value: PlaceFormValue) => void | Promise<void>;
  onDelete: (id: string) => void;
};

export default function ScheduleList({
  places,
  addingCoord,
  defaultVisitDate,
  editingId,
  busy,
  onStartAddClick,
  onUseCurrentLocation,
  onCancelAdd,
  onSubmitAdd,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
}: Props) {
  return (
    <div>
      <div className="schedule-list">
        {places.map((p) =>
          editingId === p.id ? (
            <PlaceForm
              key={p.id}
              title="장소 수정"
              submitLabel="저장"
              initial={{
                name: p.name,
                visitDate: toDateTimeLocal(p.visitDate),
                memo: p.memo,
              }}
              onSubmit={(v) => onSubmitEdit(p.id, v)}
              onCancel={onCancelEdit}
            />
          ) : (
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
              <div style={{ textAlign: "right" }}>
                {formatTime(p.visitDate) && <time>{formatTime(p.visitDate)}</time>}
                <div className="place-actions">
                  <button onClick={() => onStartEdit(p.id)} style={{ color: "var(--muted)" }}>
                    수정
                  </button>
                  <button onClick={() => onDelete(p.id)} style={{ color: "#d96b6b" }}>
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {addingCoord ? (
        <div style={{ marginTop: 14 }}>
          <PlaceForm
            title={`새 장소 (${addingCoord.lat.toFixed(5)}, ${addingCoord.lng.toFixed(5)})`}
            submitLabel="추가"
            initial={{ name: "", visitDate: defaultVisitDate, memo: "" }}
            onSubmit={onSubmitAdd}
            onCancel={onCancelAdd}
          />
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginTop: 15 }}>
          <button className="add-place" onClick={onStartAddClick} disabled={busy}>
            {busy ? "지도를 클릭해서 위치를 선택하세요" : "＋ 지도를 클릭해 장소 추가"}
          </button>
          <button className="soft-btn" onClick={onUseCurrentLocation} disabled={busy} style={{ padding: 11 }}>
            📍 현재 위치로 장소 추가
          </button>
        </div>
      )}
    </div>
  );
}

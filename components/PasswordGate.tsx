"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "로그인에 실패했어요.");
      return;
    }
    router.refresh();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg,#f5fbff 0,#eaf7ff 65%,#f8fcff 100%)",
      }}
    >
      <div
        className="card"
        style={{ padding: 32, width: 320, display: "grid", gap: 14, textAlign: "center" }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "linear-gradient(145deg,#8ed9ff,#3d91ee)",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            margin: "0 auto",
            fontSize: 20,
          }}
        >
          ✦
        </div>
        <h2 style={{ margin: 0, fontSize: 18 }}>여행 기록</h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          비밀번호를 입력하면 모든 여행을 관리할 수 있어요.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="비밀번호"
          style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)", textAlign: "center" }}
          autoFocus
        />
        {error && <p style={{ margin: 0, color: "#b3402f", fontSize: 12 }}>{error}</p>}
        <button className="primary-btn" onClick={submit} disabled={loading}>
          {loading ? "확인 중..." : "입장하기"}
        </button>
        <a href="/" style={{ fontSize: 12, color: "var(--muted)" }}>
          ← 대시보드로 돌아가기
        </a>
      </div>
    </div>
  );
}

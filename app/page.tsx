import Dashboard from "@/components/Dashboard";

export default function Home() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    return (
      <div style={{ padding: 24 }}>
        .env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되어 있지 않습니다.
      </div>
    );
  }

  return <Dashboard clientId={clientId} />;
}

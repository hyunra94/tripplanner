import { isAuthed } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import TripPlanner from "@/components/TripPlanner";

export default function RecordsPage() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!isAuthed()) {
    return <PasswordGate />;
  }

  if (!clientId) {
    return (
      <div style={{ padding: 24 }}>
        .env.local에 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되어 있지 않습니다.
      </div>
    );
  }

  return <TripPlanner clientId={clientId} />;
}

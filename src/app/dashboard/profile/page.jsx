import { listProfileData } from "./actions";
import DashboardProfileClient from "./profile-client";

export default async function DashboardProfilePage() {
  const result = await listProfileData();
  if (!result.ok) {
    return (
      <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
        {result.error}
      </div>
    );
  }

  return <DashboardProfileClient initialUser={result.user} initialFollowing={result.following} />;
}

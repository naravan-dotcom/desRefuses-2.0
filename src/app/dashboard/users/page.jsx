import { listUserAdminData } from "../actions";
import DashboardUsersClient from "./users-client";

export default async function DashboardUsersPage() {
  const result = await listUserAdminData();
  if (!result.ok) {
    return (
      <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
        {result.error}
      </div>
    );
  }

  return <DashboardUsersClient initialUsers={result.users} currentDbId={result.currentDbId} />;
}

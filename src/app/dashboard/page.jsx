import DashboardClient from "./dashboard-client";
import { listDashboardData } from "./actions";

export default async function DashboardPage() {
  const result = await listDashboardData();
  if (!result.ok) {
    return (
      <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
        {result.error}
      </div>
    );
  }

  return <DashboardClient data={result} />;
}

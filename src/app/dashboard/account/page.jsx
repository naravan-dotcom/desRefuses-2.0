import { listAccountData } from "./actions";
import DashboardAccountClient from "./account-client";

export default async function DashboardAccountPage() {
  const result = await listAccountData();
  if (!result.ok) {
    return (
      <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
        {result.error}
      </div>
    );
  }

  return <DashboardAccountClient initialUser={result.user} />;
}

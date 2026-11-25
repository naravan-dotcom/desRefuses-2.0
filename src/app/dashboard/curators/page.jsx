import { listCuratorAdminData } from "../actions";
import DashboardCuratorsClient from "./curators-client";

export default async function DashboardCuratorsPage() {
  const result = await listCuratorAdminData();
  if (!result.ok) {
    return (
      <div className="border hairline bg-white p-8 text-center text-sm text-ink/55">
        {result.error}
      </div>
    );
  }

  return <DashboardCuratorsClient initialCurators={result.curators} />;
}

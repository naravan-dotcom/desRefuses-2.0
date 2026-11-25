import { listMemberSubmissions } from "@/app/challenges/actions";
import DashboardSubmissionsClient from "./submissions-client";

export default async function DashboardSubmissionsPage() {
  const data = await listMemberSubmissions();
  return <DashboardSubmissionsClient initial={data} />;
}

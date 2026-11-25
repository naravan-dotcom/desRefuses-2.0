import { Suspense } from "react";
import { listCuratorChallengeData } from "./actions";
import DashboardChallengesClient from "./challenges-client";

export default async function DashboardChallengesPage({ searchParams }) {
  const query = await searchParams;
  const data = await listCuratorChallengeData();
  const initialCreate = query?.create === "1";
  const initialFocus = typeof query?.challenge === "string" ? query.challenge : null;
  return (
    <Suspense fallback={<div className="label text-ink/55">Memuat tantangan...</div>}>
      <DashboardChallengesClient
        initial={data}
        initialCreate={initialCreate}
        initialFocus={initialFocus}
      />
    </Suspense>
  );
}

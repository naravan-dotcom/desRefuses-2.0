export default function DashboardShell({ nav, children }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-ink/15 bg-white p-4">{nav}</aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}

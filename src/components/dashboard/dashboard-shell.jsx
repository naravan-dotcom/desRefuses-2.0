export default function DashboardShell({ nav, children, label = "Ruang kerja" }) {
  return (
    <div className="page-enter mx-auto max-w-[1240px] px-5 py-8 lg:px-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit border hairline bg-white p-5 lg:sticky lg:top-24">
          <div className="label mb-5 text-wine">{label}</div>
          {nav}
        </aside>
        <div className="min-w-0 space-y-8">{children}</div>
      </div>
    </div>
  );
}

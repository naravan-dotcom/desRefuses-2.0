export default function PhilosophyPage() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-16 border" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 border" />
          <div className="h-64 border" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 border" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 border" />
          ))}
        </div>
      </div>
    </main>
  );
}

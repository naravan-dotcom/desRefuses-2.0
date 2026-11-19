export default function HomePage() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-16 border" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 border" />
          <div className="h-72 border" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] border" />
          ))}
        </div>
        <div className="h-20 border" />
      </div>
    </main>
  );
}

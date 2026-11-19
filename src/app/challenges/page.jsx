export default function ChallengesPage() {
  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-16 border" />
        <div className="h-24 border" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[16/9] border" />
          ))}
        </div>
      </div>
    </main>
  );
}

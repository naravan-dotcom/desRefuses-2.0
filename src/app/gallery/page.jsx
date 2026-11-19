export default function GalleryPage() {
  return (
    <main className="p-6 sm:p-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-16 border" />
        <div className="h-24 border" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] border" />
          ))}
        </div>
      </div>
    </main>
  );
}

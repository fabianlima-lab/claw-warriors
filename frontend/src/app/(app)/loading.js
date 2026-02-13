export default function AppLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="h-6 w-32 bg-elevated rounded" />
        <div className="h-10 w-64 bg-elevated rounded" />

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-[var(--radius-card)] p-6 space-y-4">
              <div className="w-20 h-20 bg-elevated rounded-full mx-auto" />
              <div className="h-5 w-24 bg-elevated rounded mx-auto" />
              <div className="h-3 w-full bg-elevated rounded" />
              <div className="h-3 w-3/4 bg-elevated rounded" />
              <div className="h-2 w-full bg-elevated rounded" />
              <div className="h-2 w-full bg-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
              <div>
                <div className="h-5 w-24 bg-muted animate-pulse rounded mb-1"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-40 bg-muted animate-pulse rounded"></div>
              <div className="flex gap-1">
                <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

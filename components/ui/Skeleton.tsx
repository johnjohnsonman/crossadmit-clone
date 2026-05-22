export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gradient-to-r from-[#E5E5E0] via-[#F5F5F4] to-[#E5E5E0] bg-[length:200%_100%] ${className}`}
    />
  );
}

export function AdmissionsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#E5E5E0] rounded-xl border border-[#E5E5E0] bg-white overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-5 py-5 flex gap-6">
          <div className="w-20 space-y-2 shrink-0">
            <Shimmer className="h-8 w-14" />
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-12" />
          </div>
          <div className="flex-1 space-y-3">
            <Shimmer className="h-4 w-3/4" />
            <Shimmer className="h-4 w-1/2" />
            <Shimmer className="h-3 w-40" />
          </div>
          <div className="w-16 space-y-2 shrink-0">
            <Shimmer className="h-4 w-10" />
            <Shimmer className="h-4 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdmissionDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Shimmer className="h-32 w-full rounded-xl" />
        <Shimmer className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Shimmer className="h-28 rounded-lg" />
          <Shimmer className="h-28 rounded-lg" />
          <Shimmer className="h-28 rounded-lg" />
        </div>
        <Shimmer className="h-40 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <Shimmer className="h-56 w-full rounded-xl" />
        <Shimmer className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ForumListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#E5E5E0] bg-white p-4 space-y-2"
        >
          <div className="flex gap-2">
            <Shimmer className="h-4 w-12" />
            <Shimmer className="h-4 w-14" />
          </div>
          <Shimmer className="h-5 w-full" />
          <Shimmer className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

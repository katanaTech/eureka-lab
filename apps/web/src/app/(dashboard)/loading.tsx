import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard-level loading skeleton.
 * Shown while dashboard pages are loading.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-2">
      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Content skeleton grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

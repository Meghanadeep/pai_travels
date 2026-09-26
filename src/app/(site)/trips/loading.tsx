import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-x py-12 sm:py-16" aria-busy="true" aria-label="Loading journeys">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-14 w-2/3 max-w-lg" />
      <div className="mt-14 grid gap-10 lg:grid-cols-[17rem_1fr]">
        <div className="hidden space-y-5 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5]" />
              <Skeleton className="mt-4 h-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

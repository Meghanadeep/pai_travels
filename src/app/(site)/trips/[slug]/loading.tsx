import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading journey">
      <Skeleton className="h-[70svh] w-full" />
      <div className="container-x mt-10 grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}

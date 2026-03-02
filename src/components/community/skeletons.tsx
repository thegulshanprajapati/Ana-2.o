"use client";

import { Skeleton } from "@/components/ui/skeleton";

export const PostSkeleton = () => (
  <div className="bg-[var(--community-card-bg)] border border-[var(--community-card-border)] rounded-lg p-4">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-grow space-y-3">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
      </div>
      <div className="shrink-0">
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  </div>
);

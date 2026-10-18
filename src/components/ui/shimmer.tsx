"use client";

import { cn } from "@/lib/cn";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-neutral-200/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent",
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-neutral-200/80 shadow-sm p-3.5 space-y-3">
      {/* Aspect-square image skeleton */}
      <Shimmer className="aspect-square w-full rounded-xl" />

      {/* Category / Store name skeleton */}
      <div className="space-y-2 pt-1">
        <Shimmer className="h-3 w-1/3 rounded-md" />
        <Shimmer className="h-4 w-4/5 rounded-md" />
        <Shimmer className="h-4 w-3/5 rounded-md" />
      </div>

      {/* Rating stars skeleton */}
      <div className="flex items-center gap-1.5 pt-1">
        <Shimmer className="h-3.5 w-16 rounded-md" />
      </div>

      {/* Price & button row */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <div className="space-y-1">
          <Shimmer className="h-2.5 w-8 rounded-sm" />
          <Shimmer className="h-5 w-20 rounded-md" />
        </div>
        <Shimmer className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <Shimmer className="h-3.5 w-24 rounded-md" />
            <Shimmer className="h-8 w-8 rounded-xl" />
          </div>
          <Shimmer className="h-8 w-36 rounded-lg" />
          <Shimmer className="h-3 w-28 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function DashboardProductsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <div className="border-b border-neutral-100 p-4">
        <Shimmer className="h-5 w-40 rounded-md" />
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 gap-4">
            <div className="flex items-center gap-3">
              <Shimmer className="h-12 w-12 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Shimmer className="h-4 w-44 rounded-md" />
                <Shimmer className="h-3 w-24 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="h-5 w-20 rounded-md" />
              <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StoreHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Shimmer className="h-44 sm:h-60 w-full rounded-3xl" />
      <div className="flex items-center gap-4 px-4">
        <Shimmer className="-mt-12 h-24 w-24 rounded-full border-4 border-white shadow-md" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-6 w-48 rounded-lg" />
          <Shimmer className="h-3.5 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Shimmer className="h-12 w-12 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Shimmer className="h-4 w-32 rounded-md" />
          <Shimmer className="h-3 w-20 rounded-md" />
        </div>
      </div>
      <Shimmer className="h-12 w-full rounded-xl" />
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <Shimmer className="h-4 w-24 rounded-md" />
        <Shimmer className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

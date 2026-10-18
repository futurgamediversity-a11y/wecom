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
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-neutral-200/80 border border-neutral-300/60 p-3.5 space-y-3 shadow-sm before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:z-10">
      {/* Aspect-square image skeleton cutout */}
      <div className="aspect-square w-full rounded-xl bg-neutral-300/70" />

      {/* Category / Store name skeleton */}
      <div className="space-y-2 pt-1">
        <div className="h-3 w-1/3 rounded-md bg-neutral-300/70" />
        <div className="h-4 w-4/5 rounded-md bg-neutral-300/80" />
        <div className="h-4 w-3/5 rounded-md bg-neutral-300/70" />
      </div>

      {/* Rating stars skeleton */}
      <div className="flex items-center gap-1.5 pt-1">
        <div className="h-3.5 w-16 rounded-md bg-neutral-300/70" />
      </div>

      {/* Price & button row */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-300/50">
        <div className="space-y-1">
          <div className="h-2.5 w-8 rounded-sm bg-neutral-300/60" />
          <div className="h-5 w-20 rounded-md bg-neutral-300/80" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-neutral-300/80" />
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
          className="relative overflow-hidden rounded-2xl border border-neutral-300/60 bg-neutral-200/80 p-5 shadow-sm space-y-3 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:z-10"
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 rounded-md bg-neutral-300/70" />
            <div className="h-8 w-8 rounded-xl bg-neutral-300/80" />
          </div>
          <div className="h-8 w-36 rounded-lg bg-neutral-300/80" />
          <div className="h-3 w-28 rounded-md bg-neutral-300/70" />
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
    <div className="relative overflow-hidden rounded-2xl border border-neutral-300/60 bg-neutral-200/80 p-5 shadow-sm space-y-4 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:z-10">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-neutral-300/80 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded-md bg-neutral-300/80" />
          <div className="h-3 w-20 rounded-md bg-neutral-300/70" />
        </div>
      </div>
      <div className="h-12 w-full rounded-xl bg-neutral-300/70" />
      <div className="flex items-center justify-between pt-2 border-t border-neutral-300/50">
        <div className="h-4 w-24 rounded-md bg-neutral-300/70" />
        <div className="h-8 w-20 rounded-xl bg-neutral-300/80" />
      </div>
    </div>
  );
}

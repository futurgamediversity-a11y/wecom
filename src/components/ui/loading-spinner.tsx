"use client";

import { WComLogo } from "@/components/brand/wcom-logo";
import { cn } from "@/lib/cn";

export function LoadingCircle({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/30 px-2 py-0.5 align-middle shadow-inner",
        className
      )}
      aria-hidden="true"
    >
      <span className="relative h-2 w-7 overflow-hidden rounded-full bg-white/40">
        <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white to-transparent" />
      </span>
    </span>
  );
}

export function ButtonShimmer({
  label = "Chargement...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <span className="relative h-2 w-8 overflow-hidden rounded-full bg-white/40">
        <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white to-transparent" />
      </span>
      {label && <span className="animate-pulse">{label}</span>}
    </span>
  );
}

export function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300 w-full max-w-xs p-6 text-center">
      <div className="relative mb-1">
        <WComLogo size="md" />
      </div>
      <div className="w-40 h-2.5 rounded-full bg-neutral-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-wcom-orange via-wcom-green to-wcom-orange animate-[shimmer_1.5s_infinite]" />
      </div>
      <span className="text-xs font-semibold text-neutral-400 animate-pulse tracking-wide">
        Chargement en cours...
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-12">
      {content}
    </div>
  );
}

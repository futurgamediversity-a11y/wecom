"use client";

import { WComLogo } from "@/components/brand/wcom-logo";
import { LoaderCircle } from "lucide-react";

export function LoadingCircle({ className = "h-4 w-4" }: { className?: string }) {
  return <LoaderCircle aria-hidden="true" className={`animate-spin ${className}`} />;
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

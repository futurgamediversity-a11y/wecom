"use client";

import { WComLogo } from "@/components/brand/wcom-logo";
import { LoaderCircle } from "lucide-react";

export function LoadingCircle({ className = "h-4 w-4" }: { className?: string }) {
  return <LoaderCircle aria-hidden="true" className={`animate-spin ${className}`} />;
}

export function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
      <button
        disabled
        className="group relative flex items-center gap-3 rounded-xl bg-wcom-green px-8 py-4 text-sm font-bold text-white shadow-lg shadow-wcom-green/30 transition-all"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/60 border-l-white/60 animate-spin" style={{ animationDuration: '1s' }} />
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
        <span className="animate-pulse">Chargement en cours...</span>
      </button>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-wcom-offwhite/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-12">
      {content}
    </div>
  );
}

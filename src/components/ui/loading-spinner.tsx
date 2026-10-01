"use client";

import { WComLogo } from "@/components/brand/wcom-logo";

export function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
      <div className="relative">
        {/* Animated outer ring */}
        <div className="absolute -inset-4 rounded-full border-2 border-transparent border-t-wcom-green border-l-wcom-orange animate-spin" style={{ animationDuration: '1.5s' }} />
        {/* Inner static logo */}
        <div className="animate-pulse">
          <WComLogo size="sm" />
        </div>
      </div>
      <p className="text-sm font-semibold text-neutral-500 animate-pulse">Chargement en cours...</p>
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

import { Suspense } from "react";
import { TopNav } from "@/components/site/top-nav";
import { Footer } from "@/components/site/footer";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] px-4 pt-6 md:px-6 md:pt-8">
      <Suspense fallback={<div className="mx-auto max-w-7xl h-16 rounded-2xl border border-neutral-200/60 bg-white/80 backdrop-blur-xl shadow-lg" />}>
        <TopNav />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

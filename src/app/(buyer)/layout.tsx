import { Suspense } from "react";
import { TopNav } from "@/components/site/top-nav";
import { Footer } from "@/components/site/footer";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <Suspense fallback={<div className="h-16 border-b border-neutral-200 bg-white/90 backdrop-blur" />}>
        <TopNav />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

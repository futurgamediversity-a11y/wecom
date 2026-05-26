import { TopNav } from "@/components/site/top-nav";
import { Footer } from "@/components/site/footer";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

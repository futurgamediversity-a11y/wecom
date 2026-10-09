export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 px-4 pt-6 md:px-6 md:pt-8">
      {children}
    </div>
  );
}

import { products as fallbackProducts } from "@/lib/mock-data";
import ProductDetailClient from "./ProductDetailClient";

// Generate static params for static export
export async function generateStaticParams() {
  return fallbackProducts.map((p) => ({
    id: p.id,
  }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}

import SellerProductDetail from "./SellerProductDetail";

export default async function SellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SellerProductDetail id={id} />;
}

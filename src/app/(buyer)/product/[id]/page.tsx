import { products as fallbackProducts } from "@/lib/mock-data";
import ProductDetailClient from "./ProductDetailClient";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Generate static params for static export
export async function generateStaticParams() {
  try {
    // Fetch all product IDs from Firebase at build time
    const querySnapshot = await getDocs(collection(db, "products"));
    const productIds = querySnapshot.docs.map(doc => ({
      id: doc.id,
    }));
    
    // If we got products from Firebase, use those, otherwise use fallback
    if (productIds.length > 0) {
      console.log("Fetched product IDs for static generation:", productIds);
      return productIds;
    }
  } catch (error) {
    console.error("Error fetching product IDs for static generation:", error);
  }
  
  // Fallback to mock data if there's an error
  return fallbackProducts.map((p) => ({
    id: p.id,
  }));
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}

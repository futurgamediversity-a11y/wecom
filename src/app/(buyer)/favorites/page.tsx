"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Product } from "@/lib/mock-data";
import { formatXOF } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Port of lib/screens/favorites_screen.dart — list of favorited products
 * with quick-action to remove or jump to the product page.
 */
export default function FavoritesPage() {
  const { user, favorites, toggleFavorite, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!user || favorites.length === 0) {
        setProducts([]);
        setProductsLoading(false);
        return;
      }

      try {
        const productsData: Product[] = [];
        for (const productId of favorites) {
          const productDoc = await getDoc(doc(db, "products", productId));
          if (productDoc.exists()) {
            const data = productDoc.data();
            productsData.push({
              id: productDoc.id,
              name: data.name,
              description: data.description,
              price: data.price,
              currency: "XOF",
              images: data.imageUrls || [data.imageUrl],
              category: data.category,
              storeId: data.storeId,
              storeName: "Boutique",
              rating: 0,
              reviewCount: 0,
              stock: data.quantity || 0,
              status: data.status
            });
          }
        }
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching favorite products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, favorites]);

  if (loading || productsLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-black">Mes favoris</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Retrouvez les articles que vous avez enregistrés.
      </p>

      {products.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <Heart className="mx-auto h-12 w-12 text-neutral-300" />
          <h2 className="mt-3 text-lg font-bold">Vous n'avez pas encore de favoris</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Cliquez sur le cœur d&apos;un produit pour l&apos;ajouter ici.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block text-sm font-bold text-wcom-orange hover:underline"
          >
            Aller à la boutique →
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((p) => (
            <li key={p.id}>
              <Card className="flex gap-4 p-4">
                <Link
                  href={`/product/${p.id}`}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-neutral-100"
                >
                  <Image
                    src={(p.images && p.images[0]) || "/images/app_icon.png"}
                    alt={p.name || "Product"}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link
                    href={`/product/${p.id}`}
                    className="text-sm font-bold hover:text-wcom-orange"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-neutral-500">{p.storeName}</p>
                  <p className="mt-1 text-base font-black text-wcom-orange">
                    {formatXOF(p.price || 0)}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <Link href={`/product/${p.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        Voir le produit
                      </Button>
                    </Link>
                    <button
                      onClick={() => toggleFavorite(p.id)}
                      className="rounded-sm border border-neutral-200 p-2 text-neutral-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                      aria-label="Retirer des favoris"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

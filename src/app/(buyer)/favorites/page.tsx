"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Product } from "@/lib/types";
import { formatXOF } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { fetchStoreNames } from "@/lib/store";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Port of lib/screens/favorites_screen.dart — list of favorited products
 * with quick-action to remove or jump to the product page.
 */
export default function FavoritesPage() {
  const { user, favorites, toggleFavorite, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isDisplayingSuggestions, setIsDisplayingSuggestions] = useState(false);

  useEffect(() => {
    console.log("FavoritesPage useEffect - user:", user?.uid, "favorites:", favorites);
    
    const applyStoreNames = async (list: Product[]) => {
    const names = await fetchStoreNames(list.map((product) => product.storeId ?? ""));
    if (names.size === 0) return;
    setProducts((previous) =>
      previous.map((product) => ({
        ...product,
        storeName: names.get(product.storeId ?? "") ?? product.storeName,
      }))
    );
  };

  const fetchSuggestions = async () => {
      try {
        console.log("Fetching suggestions from database...");
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
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
          } as Product;
        });
        const suggestions = fetchedProducts.slice(0, 8); // top 8 as suggestions
        setProducts(suggestions);
        await applyStoreNames(suggestions);
        setIsDisplayingSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setProductsLoading(false);
      }
    };

    const fetchFavoriteProducts = async () => {
      if (!user) {
        console.log("No connected user, loading suggestions");
        await fetchSuggestions();
        return;
      }

      try {
        console.log("Fetching user favorites from user document...");
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let favoriteProductIds: string[] = [];
        if (userDocSnap.exists()) {
          favoriteProductIds = userDocSnap.data().favorites || [];
        }

        if (favoriteProductIds.length === 0) {
          console.log("User has no favorites in document, loading suggestions");
          await fetchSuggestions();
          return;
        }

        console.log("Fetching favorite products for IDs:", favoriteProductIds);
        const productsData: Product[] = [];
        for (const productId of favoriteProductIds) {
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
        console.log("Fetched favorite products:", productsData);
        setProducts(productsData);
        await applyStoreNames(productsData);
        setIsDisplayingSuggestions(false);
      } catch (error) {
        console.error("Error fetching favorite products:", error);
        await fetchSuggestions();
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
      {isDisplayingSuggestions ? (
        <div className="mb-8">
          <Card className="p-8 text-center bg-neutral-50/50">
            <Heart className="mx-auto h-12 w-12 text-neutral-300" />
            <h2 className="mt-3 text-lg font-bold">
              {!user ? "Connectez-vous pour enregistrer des favoris" : "Vous n'avez pas encore de favoris"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {!user 
                ? "Créez un compte ou connectez-vous pour retrouver vos articles préférés."
                : "Cliquez sur le cœur d'un produit dans la boutique pour l'ajouter ici."}
            </p>
            <Link
              href={!user ? "/login" : "/shop"}
              className="mt-5 inline-block rounded-sm bg-wcom-orange px-4 py-2 text-sm font-bold text-white shadow hover:bg-amber-600"
            >
              {!user ? "Se connecter" : "Aller à la boutique →"}
            </Link>
          </Card>
          
          <div className="mt-10">
            <h2 className="text-xl font-black text-neutral-900">Découvrez nos produits</h2>
            <p className="text-sm text-neutral-500">Voici quelques suggestions d'articles disponibles sur W-COM.</p>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-black">Mes favoris</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Retrouvez les articles que vous avez enregistrés.
          </p>
        </div>
      )}

      {products.length > 0 && (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((p) => {
            const isFav = favorites.includes(p.id);
            return (
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
                    {p.storeId ? (
                      <Link
                        href={`/store/${p.storeId}`}
                        className="text-xs text-neutral-500 hover:text-wcom-orange hover:underline"
                      >
                        {p.storeName}
                      </Link>
                    ) : (
                      <p className="text-xs text-neutral-500">{p.storeName}</p>
                    )}
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
                        className={`rounded-sm border p-2 transition ${
                          isFav
                            ? "border-red-200 text-red-500 bg-red-50 hover:bg-red-100"
                            : "border-neutral-200 text-neutral-400 hover:border-wcom-orange/40 hover:text-wcom-orange"
                        }`}
                        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        {isFav ? <Trash2 className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

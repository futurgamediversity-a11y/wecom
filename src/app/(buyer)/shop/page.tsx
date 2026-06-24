"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  LayoutGrid,
  Shirt,
  Smartphone,
  Sparkles,
  Sofa,
  Star,
  ShoppingBag,
} from "lucide-react";
import { categories, recentSearches, products as fallbackProducts, type Product } from "@/lib/mock-data";
import { formatXOF } from "@/lib/format";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  LayoutGrid,
  Shirt,
  Smartphone,
  Sparkles,
  Sofa,
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log("Fetching products from Firebase...");
        const querySnapshot = await getDocs(collection(db, "products"));
        console.log("Query snapshot size:", querySnapshot.size);
        const fetchedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Product doc:", doc.id, data);
          return {
            id: doc.id,
            ...data
          } as Product;
        });
        
        console.log("Fetched products:", fetchedProducts);
        if (fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
        }
      } catch (error: unknown) {
        console.error("Error fetching products from Firebase:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown Firebase error";
        setFirebaseError(errorMessage);
      }
    }
    
    fetchProducts();
  }, []);
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {firebaseError && (
        <div className="mb-8 rounded-lg bg-red-50 p-4 border border-red-200">
          <h3 className="text-red-800 font-bold">⚠️ Firebase Error</h3>
          <p className="text-red-600 text-sm mt-1">{firebaseError}</p>
          <p className="text-red-600 text-sm mt-2">
            <strong>Currently showing mock data.</strong> To fix this:
            <br />1. Go to Firebase Console → Firestore Database → Rules
            <br />2. Set your rules to allow read access (at least for testing):
            <pre className="bg-red-100 p-2 rounded mt-2 text-xs">
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read: if true;
    }
  }
}
            </pre>
          </p>
        </div>
      )}
      {/* Hero strip */}
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-wcom-orange to-amber-500 p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
              Ventes Flash · Abidjan
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Jusqu&apos;à -40% sur la Mode et l&apos;Électronique
            </h1>
            <p className="mt-2 max-w-xl text-white/90">
              Livraison en moins de 24h dans toutes les communes d&apos;Abidjan.
            </p>
            <Link
              href="#produits"
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-white px-4 py-2 text-sm font-bold text-wcom-orange shadow"
            >
              Voir les offres <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden h-32 w-32 shrink-0 md:block">
            <Zap className="h-full w-full text-white/60" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-8">
        <h2 className="text-lg font-bold">Catégories</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] ?? LayoutGrid;
            const accent =
              c.accent === "orange"
                ? "bg-wcom-orange text-white"
                : c.accent === "green"
                ? "bg-wcom-green/10 text-wcom-green"
                : "bg-neutral-100 text-neutral-700";
            return (
              <button
                key={c.id}
                className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-wcom-orange/40 hover:shadow-card"
              >
                <span
                  className={
                    "grid h-12 w-12 place-items-center rounded-md " + accent
                  }
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold">{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent searches */}
      <section className="mt-8">
        <h3 className="text-sm font-bold text-neutral-600">
          Recherches récentes
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentSearches.map((s) => (
            <span
              key={s}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:border-wcom-orange/40"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section id="produits" className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-black">Tendances en ce moment</h2>
          <Link href="#" className="text-sm font-semibold text-wcom-orange">
            Tout voir
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductCard({
  p,
}: {
  p: Product;
}) {
  const images = p.images || [];
  const imageUrl = images.length > 0 ? images[0] : "/images/app_icon.png";
  const rating = p.rating || 0;
  const reviewCount = p.reviewCount || 0;
  const price = p.price || 0;
  
  return (
    <Link
      href={`/product/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={imageUrl}
          alt={p.name || "Product"}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        {p.flashSale ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-wcom-orange px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            <Zap className="h-3 w-3" /> Flash
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 text-sm font-semibold text-neutral-900">
          {p.name}
        </div>
        <div className="text-xs text-neutral-500">{p.storeName}</div>
        <div className="mt-1 flex items-center gap-2">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span className="text-xs font-semibold text-neutral-700">
            {rating.toFixed(1)}
          </span>
          <span className="text-xs text-neutral-400">({reviewCount})</span>
        </div>
        <div className="mt-1 text-base font-black text-wcom-orange">
          {formatXOF(price)}
        </div>
      </div>
    </Link>
  );
}

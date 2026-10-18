"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Star,
  ShoppingBag,
  Heart,
  MapPin,
  Store,
  ArrowLeft,
} from "lucide-react";
import { type Product } from "@/lib/types";
import { formatXOF } from "@/lib/format";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toProduct, STORE_FALLBACK_IMAGE } from "@/lib/firestore-schema";
import { fetchStoreProfile, type StoreProfile } from "@/lib/store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StoreHeaderSkeleton, ProductGridSkeleton } from "@/components/ui/shimmer";
import { ProductCard } from "@/components/ui/product-card";

function StoreContent({ storeId }: { storeId: string }) {
  const [storeData, setStoreData] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();
  const { favorites, toggleFavorite, user } = useAuth();

  useEffect(() => {
    const init = async () => {
      await fetchStoreData(storeId);
      await fetchStoreProducts(storeId);
      setLoading(false);
    };
    init();
  }, [storeId]);

  const fetchStoreData = async (id: string) => {
    // stores/{id} is authoritative for storeId; users/{id} covers older
    // products that stored the seller's uid. Both reads are guarded inside
    // fetchStoreProfile, so a failing one no longer hides the other.
    const { profile, failed } = await fetchStoreProfile(id);
    if (profile) setStoreData(profile);
    if (failed) setLoadError(true);
  };

  const fetchStoreProducts = async (id: string) => {
    try {
      console.log("Fetching products for store ID:", id);
      const q = query(
        collection(db, "products"),
        where("storeId", "==", id)
      );
      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return toProduct(doc.id, data);
      });
      
      console.log("Found products:", fetchedProducts.length);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching store products:", error);
      setLoadError(true);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
        <StoreHeaderSkeleton />
        <ProductGridSkeleton count={6} />
      </main>
    );
  }

  // A read that FAILED and a store that does not exist are different
  // problems. Both used to render "Boutique non trouvée", which hid
  // permission errors behind a plausible-looking empty state.
  if (!storeData && loadError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-neutral-500">
          <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => router.back()} />
          <span>Impossible de charger la boutique.</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-sm border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:border-wcom-orange/40"
        >
          Réessayer
        </button>
      </main>
    );
  }

  if (!storeData && products.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-neutral-500">
          <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => router.back()} />
          <span>Boutique non trouvée</span>
        </div>
      </main>
    );
  }

  // The profile document may be unreadable while the catalogue is not, so
  // keep the products browsable rather than blanking the whole page.
  const store: StoreProfile =
    storeData ?? { name: "Boutique", image: STORE_FALLBACK_IMAGE };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-wcom-orange"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Store Profile Header */}
      <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Store Image */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 md:h-32 md:w-32">
            <Image
              src={store.image}
              alt={store.name}
              fill
              sizes="(max-width: 768px) 96px, 128px"
              className="object-cover"
            />
          </div>

          {/* Store Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-neutral-900 md:text-3xl">
                  {store.name}
                </h1>
                {store.location && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                    <MapPin className="h-4 w-4" />
                    <span>{store.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* stores/{id} carries averageRating and reviewCount; the
                    header used to show a hardcoded 4.5 (12 avis). */}
                {store.rating !== undefined && (
                  <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="font-bold">{store.rating.toFixed(1)}</span>
                    <span className="text-neutral-500">
                      ({store.reviewCount ?? 0} avis)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {store.description && (
              <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                {store.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2 rounded-full bg-wcom-green/10 px-3 py-1.5 text-wcom-green">
                <ShoppingBag className="h-4 w-4" />
                <span className="font-semibold">{products.length} produits</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-wcom-orange/10 px-3 py-1.5 text-wcom-orange">
                <Store className="h-4 w-4" />
                <span className="font-semibold">Vendeur vérifié</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div>
        <h2 className="text-xl font-black mb-6">Produits de la boutique</h2>
        
        {products.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 font-bold text-neutral-700">Aucun produit disponible</p>
            <p className="mt-2 text-sm text-neutral-500">
              Cette boutique n'a pas encore publié de produits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                p={{
                  ...product,
                  storeName: store.name,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function StorePage({ params }: { params: Promise<{ storeId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <StoreHeaderSkeleton />
          <ProductGridSkeleton count={6} />
        </div>
      }
    >
      <StoreLoader params={params} />
    </Suspense>
  );
}

async function StoreLoader({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <StoreContent storeId={storeId} />;
}
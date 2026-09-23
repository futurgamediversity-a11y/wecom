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
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center gap-2 text-neutral-500">
          <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => router.back()} />
          <span>Chargement de la boutique...</span>
        </div>
      </main>
    );
  }

  // A read that FAILED and a store that does not exist are different
  // problems. Both used to render "Boutique non trouvée", which hid
  // permission errors behind a plausible-looking empty state.
  if (!storeData && loadError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
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
      <main className="mx-auto max-w-7xl px-6 py-8">
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
    <main className="mx-auto max-w-7xl px-6 py-8">
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
                product={product}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                user={user}
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
    <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-8">Chargement de la boutique...</div>}>
      <StoreLoader params={params} />
    </Suspense>
  );
}

async function StoreLoader({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <StoreContent storeId={storeId} />;
}

function ProductCard({ 
  product, 
  favorites, 
  toggleFavorite, 
  user 
}: { 
  product: Product;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  user: any;
}) {
  const isFavorite = favorites.includes(product.id);
  const images = product.images || [];
  const imageUrl = images.length > 0 ? images[0] : "/images/app_icon.png";
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      toggleFavorite(product.id);
    }
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={imageUrl}
          alt={product.name || "Produit"}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute right-2 top-2 rounded-full border border-neutral-200 bg-white/90 p-2 text-neutral-600 backdrop-blur-sm hover:border-wcom-orange/40 hover:text-wcom-orange"
          aria-label="Ajouter aux favoris"
        >
          <Heart 
            className={`h-4 w-4 ${
              isFavorite 
                ? "fill-wcom-orange text-wcom-orange" 
                : ""
            }`} 
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
          {product.name || "Produit"}
        </p>
        <div className="mt-auto pt-2">
          <p className="text-sm font-black text-wcom-orange">
            {formatXOF(product.price || 0)}
          </p>
        </div>
      </div>
    </Link>
  );
}
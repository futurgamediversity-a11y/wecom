"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  Store,
  ShoppingBag,
} from "lucide-react";
import { products as fallbackProducts, type Product } from "@/lib/mock-data";
import { formatXOF } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const { favorites, toggleFavorite, user } = useAuth();
  const isFavorite = product ? favorites.includes(product.id) : false;
  
  const handleFavoriteClick = () => {
    if (user && product) {
      toggleFavorite(product.id);
    }
  };

  useEffect(() => {
    async function fetchProductData() {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
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
          } as Product);
        } else {
          const fallback = fallbackProducts.find(p => p.id === id);
          if (fallback) setProduct(fallback);
        }

        const querySnapshot = await getDocs(collection(db, "products"));
        const fetched = querySnapshot.docs.map(doc => {
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
        if (fetched.length > 0) {
          setSuggestions(fetched.filter(p => p.id !== id).slice(0, 4));
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [id]);

  if (loading) {
    return <main className="mx-auto max-w-7xl px-6 py-8">Chargement...</main>;
  }

  if (!product) {
    notFound();
  }

  const p = product;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/shop" className="hover:text-wcom-orange">
          Boutique
        </Link>
        <span>/</span>
        <Link
          href={`/shop?cat=${encodeURIComponent(p.category || "")}`}
          className="hover:text-wcom-orange"
        >
          {p.category || "Catégorie"}
        </Link>
        <span>/</span>
        <span className="font-semibold text-neutral-700">{p.name || "Produit"}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <section>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <Image
              src={(p.images && p.images[0]) || "/images/app_icon.png"}
              alt={p.name || "Product"}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {p.images && p.images.length > 1 ? (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {p.images.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-white"
                >
                  <Image
                    src={src}
                    alt={`${p.name || "Product"} — vue ${i + 1}`}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* Buying panel */}
        <section>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-black text-neutral-900 md:text-3xl">
              {p.name || "Produit"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFavoriteClick}
                className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-600 hover:border-wcom-orange/40 hover:text-wcom-orange"
                aria-label="Ajouter aux favoris"
              >
                <Heart 
                  className={`h-5 w-5 ${
                    isFavorite 
                      ? "fill-wcom-orange text-wcom-orange" 
                      : ""
                  }`} 
                />
              </button>
              <button
                className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-600 hover:border-wcom-orange/40 hover:text-wcom-orange"
                aria-label="Partager"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold">{(p.rating || 0).toFixed(1)}</span>
              <span className="text-sm text-neutral-500">
                ({p.reviewCount || 0} avis)
              </span>
            </div>
            <span className="h-4 w-px bg-neutral-200" />
            <span className="text-sm text-neutral-500">
              {(p.stock || 0) > 0 ? `${p.stock} en stock` : "Rupture"}
            </span>
          </div>

          <div className="mt-5 text-4xl font-black text-wcom-orange">
            {formatXOF(p.price || 0)}
          </div>

          {p.variants?.map((v) => (
            <div key={v.name} className="mt-6">
              <h3 className="text-sm font-bold">{v.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.options.map((opt, i) => (
                  <button
                    key={opt}
                    className={`min-w-12 rounded-sm border px-3 py-2 text-sm font-semibold transition ${i === 0 ? "border-wcom-orange bg-wcom-orange/5 text-wcom-orange" : "border-neutral-200 hover:border-wcom-orange/40"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 items-center rounded-sm border border-neutral-200 bg-white">
              <button className="px-4 text-lg font-bold text-neutral-500 hover:text-wcom-orange">
                −
              </button>
              <span className="w-10 text-center font-bold">1</span>
              <button className="px-4 text-lg font-bold text-neutral-500 hover:text-wcom-orange">
                +
              </button>
            </div>
            <Link href="/cart" className="flex-1">
              <Button variant="primary" size="lg" className="w-full gap-2">
                <ShoppingBag className="h-4 w-4" />
                Ajouter au panier
              </Button>
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-wcom-green" />
              <div>
                <p className="text-sm font-bold">Livraison Abidjan</p>
                <p className="text-xs text-neutral-500">Sous 24h</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-wcom-green" />
              <div>
                <p className="text-sm font-bold">Paiement sécurisé</p>
                <p className="text-xs text-neutral-500">Wave, OM, MoMo, carte</p>
              </div>
            </div>
          </div>

          {/* Store */}
          <Link
            href={`/store/${p.storeId || ""}`}
            className="mt-5 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-wcom-orange/40"
          >
            <div className="grid h-10 w-10 place-items-center rounded-sm bg-wcom-green/10 text-wcom-green">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">{p.storeName || "Boutique"}</p>
              <p className="text-xs text-neutral-500">Voir la boutique</p>
            </div>
            {p.storePlan === "premium" || p.storePlan === "enterprise" ? (
              <span className="rounded-sm bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                {p.storePlan}
              </span>
            ) : null}
          </Link>
        </section>
      </div>

      {/* Description */}
      <section className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-black">Description</h2>
          <p className="mt-3 leading-relaxed text-neutral-700">{p.description || "Aucune description disponible."}</p>
        </div>
        <aside className="rounded-lg border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            Avis clients
          </h3>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-black text-neutral-900">
              {(p.rating || 0).toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(p.rating || 0) ? "fill-amber-500" : ""}`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {p.reviewCount || 0} avis vérifiés
          </p>
        </aside>
      </section>

      {/* Suggestions */}
      <section className="mt-14">
        <h2 className="text-xl font-black">Vous aimerez aussi</h2>
        <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
          {suggestions
            .map((x) => (
              <Link
                key={x.id}
                href={`/product/${x.id}`}
                className="group overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
                  <Image
                    src={(x.images && x.images[0]) || "/images/app_icon.png"}
                    alt={x.name || "Produit"}
                    fill
                    sizes="240px"
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold">{x.name || "Produit"}</p>
                  <p className="mt-1 text-sm font-black text-wcom-orange">
                    {formatXOF(x.price || 0)}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}

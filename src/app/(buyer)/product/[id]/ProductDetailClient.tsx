"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import {
  Star,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  Store,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { type Product } from "@/lib/types";
import { formatXOF } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toProduct } from "@/lib/firestore-schema";
import { fetchStoreProfile } from "@/lib/store";

export default function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [storeData, setStoreData] = useState<{ name: string; image: string } | null>(null);
  const router = useRouter();
  const { favorites, toggleFavorite, user, addToCart } = useAuth();
  const isFavorite = product ? favorites.includes(product.id) : false;

  const handleFavoriteClick = () => {
    if (user && product) toggleFavorite(product.id);
  };

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    await addToCart({
      productId: product.id,
      name: product.name ?? "",
      price: product.price ?? 0,
      quantity: qty,
      imageUrl: (product.images && product.images[0]) ?? (product.imageUrl ?? "/images/app_icon.png"),
      storeId: product.storeId ?? "",
      selectedVariants,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  }, [product, qty, selectedVariants, addToCart]);

  useEffect(() => {
    async function fetchProductData() {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(toProduct(docSnap.id, data));

          // storeId is a stores/{id} document id; fetchStoreProfile reads
          // that collection first and falls back to users/{id} for older
          // products that stored the seller's uid instead.
          const sellerId = data.storeId || data.sellerId;
          if (sellerId) {
            const { profile } = await fetchStoreProfile(sellerId);
            if (profile) setStoreData({ name: profile.name, image: profile.image });
          }
        }

        const querySnapshot = await getDocs(collection(db, "products"));
        const fetched = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return toProduct(doc.id, data);
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
                {v.options.map((opt) => {
                  const isSelected = selectedVariants[v.name] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSelectedVariants(prev => ({ ...prev, [v.name]: opt }))}
                      className={`min-w-12 rounded-sm border px-3 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-wcom-orange bg-wcom-orange/5 text-wcom-orange"
                          : "border-neutral-200 hover:border-wcom-orange/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-12 items-center rounded-sm border border-neutral-200 bg-white">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 text-lg font-bold text-neutral-500 hover:text-wcom-orange"
                aria-label="Diminuer la quantité"
              >
                −
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="px-4 text-lg font-bold text-neutral-500 hover:text-wcom-orange"
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>
            <button
              onClick={
                user
                  ? handleAddToCart
                  : () => router.push(`/login?next=${encodeURIComponent(`/product/${id}`)}`)
              }
              disabled={addedToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-wcom-orange px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-600 disabled:opacity-70"
            >
              {addedToCart ? (
                <><CheckCircle2 className="h-4 w-4" /> Ajouté !</>
              ) : (
                <><ShoppingBag className="h-4 w-4" /> {user ? "Ajouter au panier" : "Connectez-vous d'abord"}</>
              )}
            </button>
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
          {/* A product with no storeId used to link to /store/, which 404s. */}
          <StoreLink storeId={p.storeId}>
            <div className="relative h-12 w-12 overflow-hidden rounded-md bg-neutral-100">
              <Image
                src={storeData?.image || "/images/app_icon.png"}
                alt={storeData?.name || "Boutique"}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-neutral-900">{storeData?.name || p.storeName || "Boutique"}</p>
              <p className="text-xs text-neutral-500">
                {p.storeId ? "Visiter la boutique" : "Boutique non renseignée"}
              </p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-wcom-green/10 text-wcom-green">
              <Store className="h-4 w-4" />
            </div>
          </StoreLink>
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

/**
 * Renders the storefront card as a link only when there is a store to open.
 * Products stored without a storeId produced href="/store/", which Next.js
 * redirects to /store and then 404s.
 */
function StoreLink({ storeId, children }: { storeId?: string; children: ReactNode }) {
  const base =
    "mt-5 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition";
  if (!storeId) return <div className={base}>{children}</div>;
  return (
    <Link href={`/store/${storeId}`} className={`${base} hover:border-wcom-orange/40`}>
      {children}
    </Link>
  );
}

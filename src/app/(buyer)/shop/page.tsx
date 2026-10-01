"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Zap,
  LayoutGrid,
  Shirt,
  Smartphone,
  Sparkles,
  Sofa,
  Star,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { type Product, type Category } from "@/lib/types";
import { formatXOF } from "@/lib/format";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toProduct } from "@/lib/firestore-schema";
import { fetchStoreNames } from "@/lib/store";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  LayoutGrid,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
};

const categories: Category[] = [
  { id: "flash", name: "Ventes Flash", icon: "Zap", accent: "orange" },
  { id: "all", name: "Tout", icon: "LayoutGrid", accent: "green" },
  { id: "fashion", name: "Mode", icon: "Shirt" },
  { id: "electronics", name: "Électronique", icon: "Smartphone" },
  { id: "beauty", name: "Beauté", icon: "Sparkles" },
  { id: "home", name: "Maison", icon: "Sofa" },
];

const recentSearches = ["Sneakers", "AirPods", "Robe Wax", "Montres"];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const searchTerm = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("Tout");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return toProduct(doc.id, data);
        });
        
        setProducts(fetchedProducts);

        // Cards showed a hardcoded "Boutique". Resolve the real names in a
        // couple of batched reads so each card names the store it links to.
        const names = await fetchStoreNames(
          fetchedProducts.map((product) => product.storeId ?? "")
        );
        if (names.size > 0) {
          setProducts((previous) =>
            previous.map((product) => ({
              ...product,
              storeName: names.get(product.storeId ?? "") ?? product.storeName,
            }))
          );
        }
      } catch (error: unknown) {
        console.error("Error fetching products from Firebase:", error);
      }
    }
    
    fetchProducts();
  }, []);

  const handleSearchTermChange = (newSearchTerm: string) => {
    // Update URL to sync with navbar search
    if (newSearchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(newSearchTerm.trim())}`);
    } else {
      router.push("/shop");
    }
  };

  const normalizeText = (value: unknown) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);
    return products.filter((product) => {
      const name = normalizeText(product.name);
      const description = normalizeText(product.description);
      const category = normalizeText(product.category);
      const selectedCategoryNormalized = normalizeText(selectedCategory);
      const categoryMatches =
        selectedCategoryNormalized === "all" ||
        selectedCategoryNormalized === "tout" ||
        category === selectedCategoryNormalized;
      const searchMatches =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        category.includes(normalizedSearch);
      return categoryMatches && searchMatches;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">

      {/* Categories */}
      <section className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Catégories</h2>
            <p className="text-sm text-neutral-500">Filtrez par catégorie ou utilisez la barre de recherche pour trouver un produit.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] ?? LayoutGrid;
            const active = selectedCategory === c.name;
            const accent =
              active
                ? "border-wcom-green bg-wcom-green text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-wcom-orange/40";
            const iconAccent =
              c.accent === "orange"
                ? "bg-wcom-orange text-white"
                : c.accent === "green"
                ? "bg-wcom-green/10 text-wcom-green"
                : "bg-neutral-100 text-neutral-700";
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.name)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition ${accent}`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-md ${iconAccent}`}>
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
            <button
              key={s}
              type="button"
              onClick={() => handleSearchTermChange(s)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:border-wcom-orange/40"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section id="produits" className="mt-10">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black">Tendances en ce moment</h2>
            <p className="text-sm text-neutral-500">
              {filteredProducts.length} produit(s) trouvé(s){selectedCategory !== "Tout" ? ` dans ${selectedCategory}` : ""}
            </p>
          </div>
          <Link href="#" className="text-sm font-semibold text-wcom-orange">
            Tout voir
          </Link>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="font-bold text-neutral-700">Aucun produit trouvé</p>
            <p className="mt-2 text-sm text-neutral-500">Essayez une autre recherche ou une autre catégorie.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-8">Chargement de la boutique...</div>}>
      <ShopContent />
    </Suspense>
  );
}

function ProductCard({
  p,
}: {
  p: Product;
}) {
  const { favorites, toggleFavorite, user } = useAuth();
  const isFavorite = favorites.includes(p.id);
  
  const images = p.images || [];
  const imageUrl = images.length > 0 ? images[0] : "/images/app_icon.png";
  const rating = p.rating || 0;
  const reviewCount = p.reviewCount || 0;
  const price = p.price || 0;
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      toggleFavorite(p.id);
    }
  };
  
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Image
          src={imageUrl}
          alt={p.name || "Product"}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition group-hover:scale-105"
        />
        <Link
          href={`/product/${p.id}`}
          className="absolute inset-0"
          aria-label={p.name || "Produit"}
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute right-2 top-2 z-10 rounded-full bg-white p-2 shadow-md hover:bg-neutral-50"
        >
          <Heart 
            className={`h-4 w-4 ${
              isFavorite 
                ? "fill-wcom-orange text-wcom-orange" 
                : "text-neutral-400"
            }`} 
          />
        </button>
        {p.flashSale ? (
          <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-sm bg-wcom-orange px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            <Zap className="h-3 w-3" /> Flash
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/product/${p.id}`}
          className="line-clamp-2 text-sm font-semibold text-neutral-900"
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
          <span className="text-xs text-neutral-500">{p.storeName}</span>
        )}
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
    </div>
  );
}

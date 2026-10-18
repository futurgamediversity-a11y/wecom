"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Shirt,
  Smartphone,
  Sparkles,
  Sofa,
  Star,
  ShoppingBag,
  Heart,
  Zap,
  Box,
} from "lucide-react";
import { type Product, type Category } from "@/lib/types";
import { formatXOF } from "@/lib/format";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ProductGridSkeleton } from "@/components/ui/shimmer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { toProduct } from "@/lib/firestore-schema";
import { fetchStoreNames } from "@/lib/store";
import { ProductCard } from "@/components/ui/product-card";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
};

const categories: Category[] = [
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
  const [isLoading, setIsLoading] = useState(true);
  const searchTerm = searchParams.get("search") || "";
  const [selectedCategory, setSelectedCategory] = useState("Tout");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
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
    <main className="mx-auto max-w-7xl py-8">

      {/* Categories */}
      <section className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-wcom-green/10 text-wcom-green">
                <Box className="h-5 w-5" aria-hidden="true" />
              </span>
              Catégories
            </h2>
            <p className="mt-1 text-sm text-neutral-500">Filtrez par catégorie ou utilisez la barre de recherche pour trouver un produit.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] ?? LayoutGrid;
            const active = selectedCategory === c.name;
            const accent =
              active
                ? "bg-wcom-green text-white shadow-lg shadow-wcom-green/30"
                : "bg-white text-neutral-700 hover:bg-neutral-100";
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
                className={`flex flex-col items-center gap-2 rounded-xl p-4 transition ${accent}`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${iconAccent}`}>
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
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 shadow-sm"
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

        {isLoading ? (
          <div className="mt-5">
            <ProductGridSkeleton count={8} />
          </div>
        ) : filteredProducts.length === 0 ? (
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
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8"><ProductGridSkeleton count={8} /></div>}>
      <ShopContent />
    </Suspense>
  );
}

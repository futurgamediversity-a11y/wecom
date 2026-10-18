"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  Star,
  ShoppingBag,
  Zap,
  Check,
} from "lucide-react";
import { type Product } from "@/lib/types";
import { formatXOF } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { ShareCardModal, type ShareCardProduct } from "./share-card-modal";

export function ProductCard({
  p,
}: {
  p: Product;
}) {
  const { favorites, toggleFavorite, user, addToCart } = useAuth();
  const isFavorite = favorites.includes(p.id);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [shareProduct, setShareProduct] = useState<ShareCardProduct | null>(null);

  const images = p.images || [];
  const imageUrl = images.length > 0 ? images[0] : (p.imageUrl || "/images/app_icon.png");
  const rating = p.rating || 0;
  const reviewCount = p.reviewCount || 0;
  const price = p.price || 0;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleFavorite(p.id);
    }
  };

  const handleQuickAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;

    setIsAdding(true);
    try {
      await addToCart({
        productId: p.id,
        name: p.name ?? "",
        price: p.price ?? 0,
        quantity: 1,
        imageUrl,
        storeId: p.storeId ?? "",
      });
      setJustAdded(true);
      // Trigger viral share card modal!
      setShareProduct({
        id: p.id,
        name: p.name ?? "Produit",
        price: p.price ?? 0,
        imageUrl,
        storeName: p.storeName,
      });
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-neutral-200/90 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-wcom-orange/30 active:scale-[0.99] select-none">
        
        {/* Top visual section */}
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          <Image
            src={imageUrl}
            alt={p.name || "Produit"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Clickable overlay to product page */}
          <Link
            href={`/product/${p.id}`}
            className="absolute inset-0 z-0"
            aria-label={p.name || "Produit"}
          />

          {/* Flash Sale Badge */}
          {p.flashSale && (
            <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-wcom-orange px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-wcom-orange/30 animate-pulse">
              <Zap className="h-3 w-3" /> Flash
            </span>
          )}

          {/* Stock state badge */}
          {typeof p.stock === "number" && p.stock <= 3 && p.stock > 0 && (
            <span className="absolute left-2.5 bottom-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-red-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
              Plus que {p.stock} !
            </span>
          )}

          {/* Favorite button with micro-animation */}
          <button
            onClick={handleFavoriteClick}
            className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-transform duration-200 hover:scale-110 active:scale-90 hover:bg-white"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              className={`h-4 w-4 transition-colors duration-200 ${
                isFavorite
                  ? "fill-wcom-orange text-wcom-orange"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            />
          </button>
        </div>

        {/* Content body */}
        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
          <div>
            {/* Store name */}
            {p.storeId ? (
              <Link
                href={`/store/${p.storeId}`}
                className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider hover:text-wcom-orange transition line-clamp-1"
              >
                {p.storeName || "Boutique partenaire"}
              </Link>
            ) : (
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider line-clamp-1">
                {p.storeName || "W-COM"}
              </span>
            )}

            {/* Product Title */}
            <Link
              href={`/product/${p.id}`}
              className="mt-1 block text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-wcom-orange transition line-clamp-2 leading-snug"
            >
              {p.name}
            </Link>

            {/* Rating stars */}
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                <span>{rating > 0 ? rating.toFixed(1) : "5.0"}</span>
              </div>
              <span className="text-neutral-400 text-[11px]">
                ({reviewCount > 0 ? reviewCount : 1})
              </span>
            </div>
          </div>

          {/* Pricing & Interactive Buttons */}
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Prix</span>
              <div className="text-sm sm:text-base font-black text-wcom-orange tracking-tight">
                {formatXOF(price)}
              </div>
            </div>

            {/* Quick Add to Cart button */}
            <button
              onClick={handleQuickAddToCart}
              disabled={isAdding}
              title="Ajouter au panier et partager"
              className={`relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl font-bold shadow-md transition-all duration-300 transform active:scale-90 overflow-hidden ${
                justAdded
                  ? "bg-wcom-green text-white scale-105 shadow-green-200"
                  : isAdding
                  ? "bg-wcom-orange text-white cursor-wait before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent"
                  : "bg-wcom-orange text-white hover:bg-orange-600 hover:shadow-orange-200"
              }`}
            >
              {justAdded ? (
                <Check className="h-4 w-4 animate-in zoom-in" />
              ) : isAdding ? (
                <span className="relative h-2 w-5 overflow-hidden rounded-full bg-white/40">
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.1s_infinite] bg-gradient-to-r from-transparent via-white to-transparent" />
                </span>
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Viral Share Card Modal on Add-To-Cart */}
      <ShareCardModal
        isOpen={Boolean(shareProduct)}
        onClose={() => setShareProduct(null)}
        product={shareProduct}
      />
    </>
  );
}

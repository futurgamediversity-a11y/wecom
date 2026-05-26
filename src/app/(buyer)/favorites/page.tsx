"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";
import { formatXOF } from "@/lib/format";

/**
 * Port of lib/screens/favorites_screen.dart — list of favorited products
 * with quick-action to remove or jump to the product page.
 */
export default function FavoritesPage() {
  const [list, setList] = useState(() => products.slice(0, 4));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-black">Mes favoris</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Retrouvez les articles que vous avez enregistrés.
      </p>

      {list.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <Heart className="mx-auto h-12 w-12 text-neutral-300" />
          <h2 className="mt-3 text-lg font-bold">Aucun favori</h2>
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
          {list.map((p) => (
            <li key={p.id}>
              <Card className="flex gap-4 p-4">
                <Link
                  href={`/product/${p.id}`}
                  className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-neutral-100"
                >
                  <Image
                    src={p.images[0]}
                    alt={p.name}
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
                    {formatXOF(p.price)}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <Link href={`/product/${p.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        Voir le produit
                      </Button>
                    </Link>
                    <button
                      onClick={() =>
                        setList((arr) => arr.filter((x) => x.id !== p.id))
                      }
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

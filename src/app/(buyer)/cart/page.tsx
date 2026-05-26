"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";
import { formatXOF } from "@/lib/format";

/**
 * Port of lib/screens/cart_screen.dart.
 * Two-column desktop layout: items list on the left, summary panel on the right.
 */
export default function CartPage() {
  const [items, setItems] = useState(() =>
    products.slice(0, 2).map((p) => ({ ...p, quantity: 1 }))
  );

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const deliveryFee = items.length ? 1500 : 0;
  const grandTotal = total + deliveryFee;

  function changeQty(id: string, d: number) {
    setItems((arr) =>
      arr
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + d) } : i))
        .filter((i) => i.quantity > 0)
    );
  }
  function removeItem(id: string) {
    setItems((arr) => arr.filter((i) => i.id !== id));
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <ShoppingBag className="h-14 w-14 text-neutral-300" />
        <h1 className="mt-4 text-2xl font-black">Votre panier est vide</h1>
        <p className="mt-2 text-neutral-500">
          Découvrez nos meilleures offres et commencez vos achats.
        </p>
        <Link href="/shop" className="mt-6">
          <Button variant="primary" size="md">
            Aller à la boutique
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-black">Mon Panier</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items */}
        <ul className="space-y-4 lg:col-span-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                <Image
                  src={i.images[0]}
                  alt={i.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/product/${i.id}`}
                      className="text-sm font-bold hover:text-wcom-orange"
                    >
                      {i.name}
                    </Link>
                    <p className="text-xs text-neutral-500">{i.storeName}</p>
                  </div>
                  <button
                    onClick={() => removeItem(i.id)}
                    className="rounded-full p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex h-10 items-center rounded-sm border border-neutral-200 bg-white">
                    <button
                      onClick={() => changeQty(i.id, -1)}
                      className="px-3 text-base font-bold text-neutral-500 hover:text-wcom-orange"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold">
                      {i.quantity}
                    </span>
                    <button
                      onClick={() => changeQty(i.id, +1)}
                      className="px-3 text-base font-bold text-neutral-500 hover:text-wcom-orange"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-base font-black text-wcom-orange">
                    {formatXOF(i.price * i.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Sous-total</dt>
              <dd className="font-semibold">{formatXOF(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Livraison</dt>
              <dd className="font-semibold">{formatXOF(deliveryFee)}</dd>
            </div>
            <div className="my-2 h-px bg-neutral-200" />
            <div className="flex justify-between text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-black text-wcom-orange">
                {formatXOF(grandTotal)}
              </dd>
            </div>
          </dl>
          <Link href="/checkout" className="mt-5 block">
            <Button variant="primary" size="md" className="w-full">
              Passer à la caisse
            </Button>
          </Link>
          <Link href="/shop" className="mt-3 block">
            <Button variant="ghost" size="sm" className="w-full">
              Continuer mes achats
            </Button>
          </Link>
        </aside>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { type Product } from "@/lib/types";
import { formatXOF } from "@/lib/format";

const communes = [
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Bingerville",
] as const;

/**
 * Port of lib/screens/checkout_screen.dart.
 * Two columns: shipping form + order summary.
 */
export default function CheckoutPage() {
  const items: (Product & { quantity: number })[] = [];
  const total = items.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0);
  const delivery = 1500;
  const [commune, setCommune] = useState(communes[0]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-black">Validation de la commande</h1>

      <form className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="border-b border-neutral-200 p-5">
              <h2 className="text-base font-bold">Coordonnées</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Nom complet</label>
                <Input
                  className="mt-2"
                  leadingIcon={<User className="h-4 w-4" />}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="text-sm font-semibold">Téléphone</label>
                <Input
                  className="mt-2"
                  leadingIcon={<Phone className="h-4 w-4" />}
                  placeholder="+225 ..."
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-neutral-200 p-5">
              <h2 className="text-base font-bold">Adresse de livraison</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Commune</label>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value as typeof commune)}
                  className="mt-2 h-12 w-full rounded-sm border border-neutral-300 bg-white px-3 text-sm focus:border-wcom-orange focus:outline-none focus:ring-2 focus:ring-wcom-orange/20"
                >
                  {communes.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Quartier / repère</label>
                <Input
                  className="mt-2"
                  leadingIcon={<MapPin className="h-4 w-4" />}
                  placeholder="Ex: Riviera Palmeraie, face à ..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Adresse complète
                </label>
                <Input
                  className="mt-2"
                  placeholder="Numéro, rue, immeuble, étage..."
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-neutral-200 p-5">
              <h2 className="text-base font-bold">Mode de livraison</h2>
            </div>
            <div className="space-y-3 p-5">
              <label className="flex cursor-pointer items-center justify-between rounded-sm border border-wcom-orange bg-wcom-orange/5 p-4">
                <div>
                  <p className="text-sm font-bold">Livraison standard</p>
                  <p className="text-xs text-neutral-500">Sous 24h à Abidjan</p>
                </div>
                <span className="text-sm font-black text-wcom-orange">
                  {formatXOF(delivery)}
                </span>
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-sm border border-neutral-200 p-4 opacity-60">
                <div>
                  <p className="text-sm font-bold">Express (2h)</p>
                  <p className="text-xs text-neutral-500">
                    Disponible bientôt
                  </p>
                </div>
                <span className="text-sm font-black">{formatXOF(3000)}</span>
              </label>
            </div>
          </Card>
        </div>

        <aside className="h-fit space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-bold">Votre commande</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="line-clamp-1">
                    {i.name}{" "}
                    <span className="text-neutral-500">× {i.quantity}</span>
                  </span>
                  <span className="font-bold">
                    {formatXOF((i.price || 0) * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="my-4 h-px bg-neutral-200" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Sous-total</dt>
                <dd>{formatXOF(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Livraison</dt>
                <dd>{formatXOF(delivery)}</dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-black text-wcom-orange">
                  {formatXOF(total + delivery)}
                </dd>
              </div>
            </dl>
            <Link href="/payment" className="mt-5 block">
              <Button variant="primary" size="md" className="w-full">
                Choisir le paiement
              </Button>
            </Link>
          </Card>
        </aside>
      </form>
    </main>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Product } from "@/lib/types";
import { formatXOF } from "@/lib/format";

const paymentMethods = [
  { id: "wave", name: "Wave", logo: "/images/payments/wave.png" },
  { id: "om", name: "Orange Money", logo: "/images/payments/om.png" },
  { id: "momo", name: "MTN Mobile Money", logo: "/images/payments/momo.png" },
  { id: "moov", name: "Moov Money", logo: "/images/payments/moov.png" },
  { id: "card", name: "Carte bancaire", logo: "/images/payments/card.png" },
];

/**
 * Port of lib/screens/payment_screen.dart — payment method picker.
 * Uses the actual /public/images/payments/* logos copied from the Flutter app.
 */
export default function PaymentPage() {
  const [method, setMethod] = useState(paymentMethods[0].id);
  const items: (Product & { quantity: number })[] = [];
  const total = 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-black">Choisir un mode de paiement</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tous les paiements sont sécurisés et chiffrés.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <ul className="space-y-3">
            {paymentMethods.map((m) => (
              <li key={m.id}>
                <label
                  className={
                    "flex cursor-pointer items-center gap-4 rounded-sm border p-4 transition " +
                    (method === m.id
                      ? "border-wcom-orange bg-wcom-orange/5"
                      : "border-neutral-200 hover:border-wcom-orange/40")
                  }
                >
                  <input
                    type="radio"
                    name="payment"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    className="h-4 w-4 accent-[#FF8200]"
                  />
                  <div className="relative h-10 w-16 shrink-0">
                    <Image
                      src={m.logo}
                      alt={m.name}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-bold">{m.name}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-start gap-3 rounded-sm border border-wcom-green/30 bg-wcom-green/5 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-wcom-green" />
            <div>
              <p className="text-sm font-bold text-wcom-green">
                Vos paiements sont protégés
              </p>
              <p className="text-xs text-neutral-600">
                Aucune donnée bancaire n&apos;est stockée par W-COM. Les paiements
                Mobile Money sont validés directement par votre opérateur.
              </p>
            </div>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h2 className="text-base font-bold">À payer</h2>
          <p className="mt-3 text-4xl font-black text-wcom-orange">
            {formatXOF(total)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Livraison incluse · {items.length} article{items.length > 1 ? "s" : ""}
          </p>

          <Link href="/orders?success=1" className="mt-5 block">
            <Button variant="primary" size="md" className="w-full">
              Payer maintenant
            </Button>
          </Link>
          <Link href="/checkout" className="mt-2 block">
            <Button variant="ghost" size="sm" className="w-full">
              Retour à la livraison
            </Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}

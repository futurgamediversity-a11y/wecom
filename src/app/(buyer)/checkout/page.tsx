"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, User, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingCircle } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { formatXOF } from "@/lib/format";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const communes = [
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Bingerville",
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems: items, removeFromCart, user } = useAuth();
  const total = items.reduce((acc, i) => acc + (i.price || 0) * i.quantity, 0);
  const delivery = items.length > 0 ? 1500 : 0;
  
  // Form fields
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [commune, setCommune] = useState(communes[0]);
  const [neighborhood, setNeighborhood] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateForm = () => {
    if (!fullName.trim()) {
      setErrorMsg("Veuillez renseigner votre nom complet.");
      return false;
    }
    if (!phone.trim()) {
      setErrorMsg("Veuillez renseigner votre numéro de téléphone.");
      return false;
    }
    if (!neighborhood.trim() && !fullAddress.trim()) {
      setErrorMsg("Veuillez préciser votre quartier ou repère de livraison.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleOpenPaymentModal = () => {
    if (!items.length) {
      setErrorMsg("Votre panier est vide.");
      return;
    }
    if (validateForm()) {
      setIsModalOpen(true);
    }
  };

  const clearCart = async () => {
    try {
      for (const item of items) {
        await removeFromCart(item.id);
      }
    } catch (e) {
      console.warn("Could not clear all cart items:", e);
    }
  };

  const handleCashOnDelivery = async () => {
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "orders"), {
        buyerId: user?.uid || "guest",
        buyerEmail: user?.email || "",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl || "",
          storeId: i.storeId || "",
          selectedVariants: i.selectedVariants || {},
        })),
        totalAmount: total + delivery,
        deliveryFee: delivery,
        subtotal: total,
        deliveryInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          common: commune,
          commune: commune,
          neighborhood: neighborhood.trim(),
          address: fullAddress.trim() || neighborhood.trim(),
        },
        paymentMethod: "Espèces à la livraison",
        status: "pending",
        timestamp: serverTimestamp(),
      });

      await clearCart();
      router.push("/orders?success=1&method=cash");
    } catch (error: any) {
      console.error("Error creating order:", error);
      alert("Erreur lors de l'enregistrement de votre commande. Veuillez réessayer.");
      setIsProcessing(false);
    }
  };

  const handleMobilePayment = async () => {
    setIsProcessing(true);
    try {
      const orderRef = await addDoc(collection(db, "orders"), {
        buyerId: user?.uid || "guest",
        buyerEmail: user?.email || "",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl || "",
          storeId: i.storeId || "",
          selectedVariants: i.selectedVariants || {},
        })),
        totalAmount: total + delivery,
        deliveryFee: delivery,
        subtotal: total,
        deliveryInfo: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          common: commune,
          commune: commune,
          neighborhood: neighborhood.trim(),
          address: fullAddress.trim() || neighborhood.trim(),
        },
        paymentMethod: "GeniusPay (Mobile Money / Carte)",
        status: "pending_payment",
        timestamp: serverTimestamp(),
      });

      const res = await fetch("/api/geniuspay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total + delivery,
          returnUrl: `${window.location.origin}/orders?success=1&orderId=${orderRef.id}`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && typeof data.paymentUrl === "string") {
        await clearCart();
        window.location.href = data.paymentUrl;
      } else {
        alert(
          typeof data.error === "string"
            ? data.error
            : "Erreur lors de l'initialisation du paiement avec GeniusPay."
        );
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erreur de connexion à GeniusPay:", error);
      alert("Impossible de contacter GeniusPay. Vérifiez votre connexion puis réessayez.");
      setIsProcessing(false);
    }
  };

  if (!items.length) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center py-20 text-center animate-in fade-in">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-wcom-orange mb-4">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900">Votre panier est vide</h1>
        <p className="mt-2 text-sm text-neutral-500 max-w-sm">
          Ajoutez des articles à votre panier avant de procéder au paiement.
        </p>
        <Button
          onClick={() => router.push("/shop")}
          variant="primary"
          size="md"
          className="mt-6"
        >
          Découvrir les produits
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl py-6 md:py-10 animate-in fade-in duration-500">
      <h1 className="text-2xl sm:text-3xl font-black text-neutral-900">Validation de la commande</h1>
      <p className="text-xs sm:text-sm text-neutral-500 mt-1">Renseignez vos coordonnées de livraison pour finaliser votre commande</p>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs sm:text-sm font-semibold text-red-600 border border-red-100">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Details */}
          <Card className="rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden bg-white">
            <div className="border-b border-neutral-100 p-5 bg-neutral-50/50">
              <h2 className="text-base font-bold text-neutral-900">1. Coordonnées de contact</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Nom complet *</label>
                <Input
                  className="mt-1.5"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leadingIcon={<User className="h-4 w-4" />}
                  placeholder="Ex: Jean Kouassi"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Numéro de téléphone *</label>
                <Input
                  className="mt-1.5"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leadingIcon={<Phone className="h-4 w-4" />}
                  placeholder="+225 07..."
                  type="tel"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden bg-white">
            <div className="border-b border-neutral-100 p-5 bg-neutral-50/50">
              <h2 className="text-base font-bold text-neutral-900">2. Adresse de livraison à Abidjan</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Commune *</label>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value as typeof commune)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-wcom-orange focus:outline-none focus:ring-2 focus:ring-wcom-orange/20"
                >
                  {communes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">Quartier / Repère *</label>
                <Input
                  className="mt-1.5"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  leadingIcon={<MapPin className="h-4 w-4" />}
                  placeholder="Ex: Riviera Palmeraie, vers Pharmacie..."
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Précisions d'adresse (facultatif)
                </label>
                <Input
                  className="mt-1.5"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Numéro, rue, immeuble, étage, porte..."
                />
              </div>
            </div>
          </Card>

          {/* Delivery option */}
          <Card className="rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden bg-white">
            <div className="border-b border-neutral-100 p-5 bg-neutral-50/50">
              <h2 className="text-base font-bold text-neutral-900">3. Mode de livraison</h2>
            </div>
            <div className="p-5 space-y-3">
              <label className="flex items-center justify-between rounded-xl border-2 border-wcom-orange bg-orange-50/20 p-4 cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-neutral-900">Livraison standard W-COM</p>
                  <p className="text-xs text-neutral-500">Livré sous 24h ouvrées à {commune}</p>
                </div>
                <span className="text-base font-black text-wcom-orange">
                  {formatXOF(delivery)}
                </span>
              </label>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <aside className="h-fit space-y-4">
          <Card className="p-5 rounded-2xl border border-neutral-200/80 shadow-sm bg-white">
            <h2 className="text-base font-bold text-neutral-900">Récapitulatif ({items.length} articles)</h2>
            <ul className="mt-4 divide-y divide-neutral-100 text-sm">
              {items.map((i) => (
                <li key={i.id} className="py-2.5 flex justify-between gap-3">
                  <span className="line-clamp-1 text-neutral-700">
                    {i.name}{" "}
                    <span className="text-xs font-bold text-neutral-400">× {i.quantity}</span>
                  </span>
                  <span className="font-bold text-neutral-900 shrink-0">
                    {formatXOF((i.price || 0) * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="my-4 h-px bg-neutral-100" />
            
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Sous-total</dt>
                <dd className="font-medium text-neutral-800">{formatXOF(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Frais de livraison</dt>
                <dd className="font-medium text-neutral-800">{formatXOF(delivery)}</dd>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-neutral-100">
                <dt className="font-bold text-neutral-900">Total à payer</dt>
                <dd className="font-black text-xl text-wcom-orange">
                  {formatXOF(total + delivery)}
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              onClick={handleOpenPaymentModal}
              variant="primary"
              size="md"
              className="w-full mt-6 rounded-xl py-3 font-bold shadow-md shadow-wcom-orange/20"
            >
              Passer au paiement
            </Button>
          </Card>
        </aside>
      </div>

      {/* Payment Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-center text-neutral-900 mb-1">Mode de paiement</h3>
            <p className="text-xs sm:text-sm text-neutral-500 text-center mb-6">
              Choisissez comment vous souhaitez régler votre commande de <strong>{formatXOF(total + delivery)}</strong>
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCashOnDelivery}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-neutral-200 hover:border-wcom-green hover:bg-green-50/40 transition group disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="font-bold text-sm text-neutral-900 group-hover:text-wcom-green">Payer à la livraison</p>
                  <p className="text-xs text-neutral-400">Réglez en espèces au coursier à réception</p>
                </div>
                <span className="text-xs font-bold text-wcom-green bg-green-100 px-2.5 py-1 rounded-full">
                  Espèces
                </span>
              </button>
              
              <button
                type="button"
                onClick={handleMobilePayment}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-wcom-orange bg-orange-50/20 hover:bg-orange-50/60 transition group disabled:opacity-50"
              >
                <div className="text-left">
                  <p className="font-bold text-sm text-neutral-900 group-hover:text-wcom-orange">
                    {isProcessing ? "Initialisation..." : "Paiement Mobile / Carte"}
                  </p>
                  <p className="text-xs text-neutral-400">Wave, Orange Money, MTN MoMo, Visa/Mastercard</p>
                </div>
                <span className="text-xs font-bold text-white bg-wcom-orange px-2.5 py-1 rounded-full shadow-sm">
                  GeniusPay
                </span>
              </button>
            </div>
            
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Bike,
  Sparkles,
  ArrowRight,
  Send,
  AlertCircle,
} from "lucide-react";
import { formatXOF } from "@/lib/format";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const TARIFFS = [
  { commune: "Cocody (Angré, Riviera, 2 Plateaux)", delay: "1h à 2h30", price: 1500, popular: true },
  { commune: "Marcory & Zone 4 / Biétry", delay: "1h à 2h30", price: 1500, popular: true },
  { commune: "Plateau & Adjamé", delay: "1h à 2h", price: 1500, popular: false },
  { commune: "Yopougon & Attécoubé", delay: "2h à 4h", price: 2000, popular: false },
  { commune: "Treichville & Koumassi", delay: "1h30 à 3h", price: 1500, popular: false },
  { commune: "Port-Bouët", delay: "2h à 4h", price: 2000, popular: false },
  { commune: "Bingerville", delay: "2h à 4h", price: 2500, popular: false },
  { commune: "Grand-Bassam", delay: "Même jour", price: 3000, popular: false },
];

interface RealTrackingResult {
  code: string;
  status: string;
  commune: string;
  address: string;
  courier?: string;
  courierPhone?: string;
  itemsCount: number;
  totalAmount: number;
  steps: { title: string; done: boolean; active?: boolean }[];
}

export default function LivreurPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingResult, setTrackingResult] = useState<RealTrackingResult | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applyError, setApplyError] = useState("");

  // Form for driver
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicle, setVehicle] = useState("Moto");
  const [driverCommune, setDriverCommune] = useState("Cocody");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCode = trackingCode.trim();
    if (!rawCode) {
      setTrackingError("Veuillez saisir un numéro de suivi ou référence de commande.");
      setTrackingResult(null);
      return;
    }

    setIsSearching(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      // 1. Search directly by doc ID in 'orders'
      let orderDocSnap = await getDoc(doc(db, "orders", rawCode));

      // 2. If not found and user typed with WCOM- or without, try alternative
      if (!orderDocSnap.exists()) {
        const altId = rawCode.startsWith("WCOM-")
          ? rawCode.replace(/^WCOM-/i, "")
          : `WCOM-${rawCode}`;
        orderDocSnap = await getDoc(doc(db, "orders", altId));
      }

      // 3. If still not found, search by trackingNumber field or orderId field
      let orderData: any = null;
      let orderId = rawCode;

      if (orderDocSnap.exists()) {
        orderData = orderDocSnap.data();
        orderId = orderDocSnap.id;
      } else {
        const qTracking = query(
          collection(db, "orders"),
          where("trackingNumber", "==", rawCode)
        );
        const qSnap = await getDocs(qTracking);
        if (!qSnap.empty) {
          orderData = qSnap.docs[0].data();
          orderId = qSnap.docs[0].id;
        }
      }

      if (!orderData) {
        setTrackingError(
          "Aucune commande trouvée avec cette référence dans la base de données W-COM. Veuillez vérifier l'identifiant."
        );
        return;
      }

      // Compute status and steps from genuine Firestore order document
      const rawStatus = (orderData.status || "pending").toString().toLowerCase();
      let statusLabel = "En attente de confirmation";
      let isDelivered = false;
      let isInDelivery = false;
      let isConfirmed = false;

      if (["delivered", "livrée", "livre"].includes(rawStatus)) {
        statusLabel = "Colis livré";
        isDelivered = true;
        isInDelivery = true;
        isConfirmed = true;
      } else if (["in_delivery", "en livraison", "shipped"].includes(rawStatus)) {
        statusLabel = "En cours de livraison";
        isInDelivery = true;
        isConfirmed = true;
      } else if (["confirmed", "confirmée", "processing", "en cours"].includes(rawStatus)) {
        statusLabel = "Commande confirmée";
        isConfirmed = true;
      } else if (["cancelled", "annulée"].includes(rawStatus)) {
        statusLabel = "Commande annulée";
      }

      const steps = [
        {
          title: "Commande enregistrée",
          done: true,
          active: !isConfirmed && rawStatus !== "cancelled",
        },
        {
          title: "Commande confirmée par le vendeur",
          done: isConfirmed,
          active: isConfirmed && !isInDelivery,
        },
        {
          title: "Prise en charge par le coursier W-COM",
          done: isInDelivery,
          active: isInDelivery && !isDelivered,
        },
        {
          title: "Livré à l'adresse de destination",
          done: isDelivered,
          active: isDelivered,
        },
      ];

      const deliveryInfo = orderData.deliveryInfo || {};
      const commune =
        deliveryInfo.commune || deliveryInfo.common || "Abidjan";
      const fullAddress =
        deliveryInfo.fullAddress ||
        deliveryInfo.address ||
        (deliveryInfo.neighborhood ? `${deliveryInfo.neighborhood}, ${commune}` : commune);

      setTrackingResult({
        code: orderId,
        status: statusLabel,
        commune,
        address: fullAddress,
        courier: orderData.courierName || undefined,
        courierPhone: orderData.courierPhone || undefined,
        itemsCount: Array.isArray(orderData.items) ? orderData.items.length : 1,
        totalAmount: orderData.totalAmount || 0,
        steps,
      });
    } catch (err) {
      console.error("Erreur lors de la recherche du colis Firestore:", err);
      setTrackingError("Une erreur est survenue lors de la recherche dans la base de données.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim() || !driverPhone.trim()) return;

    setSubmittingApply(true);
    setApplyError("");

    try {
      // Save application directly to Firebase Firestore
      await addDoc(collection(db, "courier_applications"), {
        fullName: driverName.trim(),
        phone: driverPhone.trim(),
        vehicle,
        commune: driverCommune,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setApplied(true);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la candidature:", err);
      setApplyError("Impossible d'enregistrer votre candidature. Veuillez réessayer.");
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 animate-in fade-in duration-500">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 p-6 sm:p-12 text-white shadow-xl mb-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-wcom-orange/20 text-wcom-orange border border-wcom-orange/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Truck className="h-3.5 w-3.5" /> Réseau de livraison W-COM Express
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Vos livraisons rapides et garanties partout à Abidjan
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
            Coursiers vérifiés, suivi en temps réel et tarifs transparents pour toutes vos commandes passées sur W-COM.
          </p>
        </div>

        {/* Decorative badge */}
        <div className="absolute right-8 bottom-8 hidden lg:flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-wcom-green text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-black text-sm">100% Sécurisé</p>
            <p className="text-xs text-neutral-400">Paiement & colis garantis</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-16">
        
        {/* Left: Live Tracking Tool */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-wcom-orange/10 text-wcom-orange">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-neutral-900">Suivre un colis</h2>
                <p className="text-xs text-neutral-500">Recherchez votre colis par référence de commande Firestore</p>
              </div>
            </div>

            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: Identifiant de commande..."
                className="h-12 flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-800 focus:bg-white focus:border-wcom-orange focus:ring-2 focus:ring-wcom-orange/20 outline-none uppercase placeholder:normal-case shadow-sm"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="h-12 rounded-2xl bg-wcom-orange px-6 text-sm font-bold text-white shadow-md shadow-wcom-orange/25 transition hover:bg-orange-600 shrink-0 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearching ? <LoadingSpinner /> : "Suivre mon colis"}
              </button>
            </form>

            {trackingError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}

            {/* Tracking Result Card */}
            {trackingResult && (
              <div className="mt-6 rounded-2xl border border-wcom-green/30 bg-green-50/40 p-5 sm:p-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-green-200/60 pb-4 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-green-700 tracking-wider">
                      Identifiant commande Firestore
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 break-all">{trackingResult.code}</h3>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-green-600 text-white px-3 py-1 text-xs font-bold shrink-0 self-start sm:self-center">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    {trackingResult.status}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl bg-white p-3 border border-neutral-100">
                    <span className="text-xs text-neutral-400 block font-medium">Destination</span>
                    <p className="font-bold text-sm text-neutral-800">{trackingResult.commune}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{trackingResult.address}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-neutral-100">
                    <span className="text-xs text-neutral-400 block font-medium">Contenu & Montant</span>
                    <p className="font-bold text-sm text-neutral-800">{formatXOF(trackingResult.totalAmount)}</p>
                    <span className="text-xs text-neutral-400">{trackingResult.itemsCount} article(s)</span>
                  </div>
                </div>

                {trackingResult.courier && (
                  <div className="mb-6 rounded-xl bg-white p-3 border border-neutral-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-neutral-400 block font-medium">Livreur assigné</span>
                      <p className="font-bold text-sm text-neutral-800">{trackingResult.courier}</p>
                    </div>
                    {trackingResult.courierPhone && (
                      <a
                        href={`tel:${trackingResult.courierPhone}`}
                        className="inline-flex items-center gap-1 text-xs text-wcom-green font-bold hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" /> Appeler
                      </a>
                    )}
                  </div>
                )}

                {/* Real Timeline */}
                <div className="space-y-4">
                  {trackingResult.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold shrink-0 ${
                          step.done
                            ? "bg-wcom-green text-white"
                            : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {step.done ? "✓" : idx + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <p
                          className={`text-sm ${
                            step.active
                              ? "font-black text-neutral-900"
                              : step.done
                              ? "font-bold text-neutral-800"
                              : "text-neutral-400"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tariffs Table */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-neutral-900">Grille tarifaire par commune</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Tarifs indicatifs appliqués à la livraison urbaine</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
                Abidjan & périphérie
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {TARIFFS.map((t) => (
                <div key={t.commune} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-wcom-orange shrink-0" />
                    <div>
                      <span className="text-sm font-bold text-neutral-900">{t.commune}</span>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                        <Clock className="h-3 w-3" /> Délai moyen : {t.delay}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-neutral-900">{formatXOF(t.price)}</span>
                    {t.popular && (
                      <span className="block text-[10px] font-bold text-wcom-green uppercase tracking-wider">
                        Populaire
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Courier Recruitment Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200/80 bg-gradient-to-b from-wcom-green/10 via-white to-white p-6 sm:p-8 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-wcom-green text-white mb-4 shadow-md">
              <Bike className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-black text-neutral-900">
              Devenez livreur partenaire W-COM
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Vous possédez une moto ou un véhicule à Abidjan ? Rejoignez notre équipe de coursiers et générez des revenus chaque jour en toute liberté.
            </p>

            <ul className="mt-6 space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5 font-semibold text-neutral-800">
                <CheckCircle2 className="h-4 w-4 text-wcom-green shrink-0" />
                <span>Revenus payés régulièrement</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-neutral-800">
                <CheckCircle2 className="h-4 w-4 text-wcom-green shrink-0" />
                <span>Horaires 100% flexibles selon vos dispos</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-neutral-800">
                <CheckCircle2 className="h-4 w-4 text-wcom-green shrink-0" />
                <span>Courses quotidiennes garanties</span>
              </li>
              <li className="flex items-center gap-2.5 font-semibold text-neutral-800">
                <CheckCircle2 className="h-4 w-4 text-wcom-green shrink-0" />
                <span>Support coursier dédié 7j/7</span>
              </li>
            </ul>

            <button
              onClick={() => setShowApplyModal(true)}
              className="mt-8 w-full rounded-2xl bg-wcom-green py-3.5 text-sm font-bold text-white shadow-lg shadow-wcom-green/25 hover:bg-[#007b2f] transition"
            >
              Postuler comme livreur →
            </button>
          </div>

          {/* Guarantees Box */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm space-y-4">
            <h4 className="text-sm font-black uppercase tracking-wider text-neutral-400">
              Nos engagements
            </h4>
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-orange-50 text-wcom-orange shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-800">Colis sous scellé</p>
                <p className="text-xs text-neutral-500">Chaque marchandise est inspectée avant expédition.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-green-50 text-wcom-green shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-800">Ponctualité garantie</p>
                <p className="text-xs text-neutral-500">Notification SMS dès que le coursier est en route.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {applied ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-100 text-green-600 shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-neutral-900">Candidature enregistrée !</h3>
                <p className="text-neutral-600 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                  Votre candidature a bien été enregistrée dans notre base de données. Notre responsable de flotte prendra contact avec vous sur WhatsApp au <strong>{driverPhone}</strong> sous 24h ouvrées.
                </p>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setApplied(false);
                    setDriverName("");
                    setDriverPhone("");
                  }}
                  className="rounded-xl bg-wcom-green px-6 py-2.5 text-sm font-bold text-white hover:bg-[#007b2f] transition"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-5">
                  <h3 className="text-lg font-black text-neutral-900">Rejoindre la flotte W-COM</h3>
                  <button onClick={() => setShowApplyModal(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
                </div>

                {applyError && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium">
                    {applyError}
                  </div>
                )}

                <form onSubmit={handleApply} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Nom et prénom *</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Ex: Kouamé Jean"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-wcom-green focus:ring-2 focus:ring-wcom-green/20 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Numéro WhatsApp *</label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+225 07..."
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-wcom-green focus:ring-2 focus:ring-wcom-green/20 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Véhicule</label>
                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm bg-white"
                      >
                        <option>Moto</option>
                        <option>Tricycle</option>
                        <option>Voiture</option>
                        <option>Vélo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">Zone habituelle</label>
                      <select
                        value={driverCommune}
                        onChange={(e) => setDriverCommune(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm bg-white"
                      >
                        <option>Cocody</option>
                        <option>Marcory</option>
                        <option>Yopougon</option>
                        <option>Plateau</option>
                        <option>Autre commune</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(false)}
                      className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submittingApply}
                      className="flex-1 rounded-xl bg-wcom-green py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#007b2f] disabled:opacity-50"
                    >
                      {submittingApply ? "Envoi..." : "Envoyer ma candidature"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
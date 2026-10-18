"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, CheckCircle2, ChevronRight, Store, Package, CreditCard, Sparkles } from "lucide-react";
import { formatXOF } from "@/lib/format";
import { usePricing } from "@/lib/pricing";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

const CATEGORIES = [
  "Mode",
  "Électronique",
  "Beauté",
  "Maison",
  "Alimentation",
  "Sport",
  "Autre",
];

async function uploadImage(file: File): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("/api/upload-signature", { method: "POST", signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const { signature, timestamp, api_key, cloud_name } = await res.json();
      if (cloud_name && cloud_name !== "W-com_preset" && api_key && signature) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", api_key);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);

        const uploadController = new AbortController();
        const uploadTimer = setTimeout(() => uploadController.abort(), 6000);
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
          method: "POST",
          body: formData,
          signal: uploadController.signal,
        });
        clearTimeout(uploadTimer);

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          if (data.secure_url) return data.secure_url;
        }
      }
    }
  } catch (err) {
    console.warn("Cloudinary upload failed or timed out, using fallback:", err);
  }

  // Instant base64 fallback so store setup never blocks or fails
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || "/images/app_icon.png");
    reader.onerror = () => resolve("/images/app_icon.png");
    reader.readAsDataURL(file);
  });
}

export function StoreWizard({ 
  userId, 
  onComplete 
}: { 
  userId: string; 
  onComplete: (storeId: string) => void;
}) {
  const { pricing, loading: pricingLoading } = usePricing();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Store info
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [storeCategory, setStoreCategory] = useState(CATEGORIES[0]);
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeLogoPrev, setStoreLogoPrev] = useState("");
  const [storeBanner, setStoreBanner] = useState<File | null>(null);
  const [storeBannerPrev, setStoreBannerPrev] = useState("");

  // Step 2: First product
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodQty, setProdQty] = useState("");
  const [prodImg, setProdImg] = useState<File | null>(null);
  const [prodImgPrev, setProdImgPrev] = useState("");

  // Step 3: Plan from Firestore config/pricing
  const [plan, setPlan] = useState<"monthly" | "quarterly" | "annual">("monthly");
  
  const monthlyPrice = pricing.seller.mensuel;
  const quarterlyPrice = pricing.seller.trimestriel;
  const annualPrice = pricing.seller.annuel;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setFile: any, setPrev: any) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setPrev(URL.createObjectURL(file));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!storeName || !storeDesc || !storeLogo || !storeBanner) {
        setError("Veuillez remplir tous les champs et ajouter les images.");
        return;
      }
    }
    if (step === 2) {
      if (!prodName || !prodPrice || !prodDesc || !prodQty || !prodImg) {
        setError("Veuillez remplir tous les champs du produit.");
        return;
      }
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Process images simultaneously in parallel (never hangs!)
      const [logoUrl, bannerUrl, prodUrl] = await Promise.all([
        uploadImage(storeLogo!),
        uploadImage(storeBanner!),
        uploadImage(prodImg!),
      ]);

      // 2. Prepare pending store setup data in sessionStorage
      const setupPayload = {
        userId,
        storeName,
        storeDesc,
        storeCategory,
        logoUrl,
        bannerUrl,
        plan,
        prodName,
        prodPrice: Number(prodPrice),
        prodDesc,
        prodQty: Number(prodQty),
        prodUrl,
      };

      try {
        sessionStorage.setItem("wcom_pending_store_setup", JSON.stringify(setupPayload));
      } catch (storageErr) {
        console.warn("sessionStorage warning:", storageErr);
      }

      // 3. Current plan price from live pricing
      const amount =
        plan === "monthly"
          ? monthlyPrice
          : plan === "quarterly"
          ? quarterlyPrice
          : annualPrice;

      const activeUid = auth.currentUser?.uid || userId;
      if (!activeUid) {
        throw new Error("Session expirée. Veuillez vous reconnecter avant de lancer la boutique.");
      }

      // When amount === 0: activate immediately in Firestore
      if (amount === 0) {
        const storeRef = await addDoc(collection(db, "stores"), {
          ownerId: activeUid,
          storeName,
          name: storeName,
          description: storeDesc,
          category: storeCategory,
          profileImageUrl: logoUrl,
          image: logoUrl,
          bannerImageUrl: bannerUrl,
          banner: bannerUrl,
          plan,
          isActive: true,
          isPaid: true,
          createdAt: serverTimestamp(),
        });

        // Update user document with seller role & storeId
        try {
          await updateDoc(doc(db, "users", activeUid), {
            storeId: storeRef.id,
            role: "seller",
            updatedAt: serverTimestamp(),
          });
        } catch (uErr) {
          console.warn("Could not update user doc with storeId:", uErr);
        }

        await addDoc(collection(db, "products"), {
          storeId: storeRef.id,
          sellerId: activeUid,
          name: prodName,
          price: Number(prodPrice),
          description: prodDesc,
          quantity: Number(prodQty),
          category: storeCategory,
          imageUrl: prodUrl,
          imageUrls: [prodUrl],
          status: "active",
          createdAt: serverTimestamp(),
        });

        onComplete(storeRef.id);
        return;
      }

      // Paid plans (> 0 XOF): initiate GeniusPay payment session
      const origin = window.location.origin;
      const planLabel =
        plan === "monthly"
          ? "Mensuel"
          : plan === "quarterly"
          ? "Trimestriel"
          : "Annuel";

      const res = await fetch("/api/geniuspay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          returnUrl: `${origin}/seller/dashboard?payment_success=true`,
          cancelUrl: `${origin}/seller/dashboard?payment_cancelled=true`,
          description: `Abonnement W-COM Vente (${planLabel}) - ${storeName}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement GeniusPay.");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      } else {
        throw new Error("Lien de paiement GeniusPay introuvable.");
      }
    } catch (err: any) {
      console.error("Error setting up store:", err);
      if (
        err?.code === "permission-denied" ||
        err?.message?.includes("Missing or insufficient permissions")
      ) {
        setError(
          "Erreur de permissions Firebase : Les règles Firestore doivent autoriser la création de boutiques dans 'stores'. Veuillez vérifier vos règles de sécurité Firestore."
        );
      } else {
        setError(err.message || "Une erreur est survenue lors de la création de la boutique.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-300">
      <div className="w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-wcom-offwhite px-5 md:px-8 py-5 md:py-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-wcom-ink">Créez votre boutique</h2>
            <p className="text-xs md:text-sm font-medium text-neutral-500 mt-1">Étape {step} sur 3</p>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <div className={`h-2 md:h-2.5 w-6 md:w-10 rounded-full transition-colors ${step >= 1 ? "bg-wcom-green" : "bg-neutral-200"}`} />
            <div className={`h-2 md:h-2.5 w-6 md:w-10 rounded-full transition-colors ${step >= 2 ? "bg-wcom-green" : "bg-neutral-200"}`} />
            <div className={`h-2 md:h-2.5 w-6 md:w-10 rounded-full transition-colors ${step >= 3 ? "bg-wcom-green" : "bg-neutral-200"}`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-5 md:px-8 py-6 md:py-8 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100 flex items-center gap-2">
              <X className="h-5 w-5" /> {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-wcom-green/10 flex items-center justify-center text-wcom-green">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-wcom-ink">Identité de la boutique</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Nom de la boutique *</label>
                    <input
                      value={storeName} onChange={e => setStoreName(e.target.value)}
                      className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-wcom-green/20 outline-none shadow-sm"
                      placeholder="Ma super boutique"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Catégorie *</label>
                    <select
                      value={storeCategory} onChange={e => setStoreCategory(e.target.value)}
                      className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white outline-none shadow-sm"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Description *</label>
                    <textarea
                      value={storeDesc} onChange={e => setStoreDesc(e.target.value)}
                      className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-wcom-green/20 outline-none resize-none h-24 shadow-sm"
                      placeholder="Décrivez votre activité..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Logo (Photo de profil) *</label>
                    <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-2xl bg-neutral-50 hover:bg-neutral-100 overflow-hidden relative shadow-sm">
                      {storeLogoPrev ? (
                        <Image src={storeLogoPrev} alt="Logo" fill className="object-cover" />
                      ) : (
                        <Upload className="h-6 w-6 text-neutral-400" />
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, setStoreLogo, setStoreLogoPrev)} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Bannière *</label>
                    <label className="flex h-28 w-full cursor-pointer items-center justify-center rounded-2xl bg-neutral-50 hover:bg-neutral-100 overflow-hidden relative shadow-sm">
                      {storeBannerPrev ? (
                        <Image src={storeBannerPrev} alt="Banner" fill className="object-cover" />
                      ) : (
                        <div className="text-center text-neutral-400">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-xs font-medium">Format paysage recommandé</span>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, setStoreBanner, setStoreBannerPrev)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-wcom-orange/10 flex items-center justify-center text-wcom-orange">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-wcom-ink">Votre premier produit</h3>
              </div>
              <p className="text-sm text-neutral-500 mb-6 -mt-4">Ajoutez au moins un produit pour activer votre vitrine.</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Nom du produit *</label>
                    <input
                      value={prodName} onChange={e => setProdName(e.target.value)}
                      className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-wcom-orange/20 outline-none shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Prix (FCFA) *</label>
                      <input
                        type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)}
                        className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white outline-none shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Quantité *</label>
                      <input
                        type="number" value={prodQty} onChange={e => setProdQty(e.target.value)}
                        className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white outline-none shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Description *</label>
                    <textarea
                      value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                      className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm focus:bg-white outline-none resize-none h-20 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Photo du produit *</label>
                  <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-2xl bg-neutral-50 hover:bg-neutral-100 overflow-hidden relative shadow-sm">
                    {prodImgPrev ? (
                      <Image src={prodImgPrev} alt="Product" fill className="object-cover" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                        <span className="text-sm font-medium text-neutral-500">Ajouter une photo</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e, setProdImg, setProdImgPrev)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-wcom-ink">Choisissez votre plan</h3>
              </div>
              <p className="text-sm text-neutral-500 mb-6 -mt-4">Sélectionnez l'abonnement Wcom Vente adapté à votre business.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Monthly Plan (0 FCFA) */}
                <div
                  onClick={() => setPlan("monthly")}
                  className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 border-2 ${
                    plan === "monthly"
                      ? "bg-wcom-green border-wcom-green text-white shadow-xl shadow-wcom-green/25 ring-4 ring-wcom-green/20"
                      : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-black text-base ${plan === "monthly" ? "text-white" : "text-neutral-900"}`}>
                        Plan Mensuel
                      </h4>
                      <span className={`inline-block text-[10px] font-bold mt-1 rounded-full px-2.5 py-0.5 ${
                        plan === "monthly" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                      }`}>
                        Sans engagement
                      </span>
                    </div>
                    {plan === "monthly" ? (
                      <div className="rounded-full bg-white p-1 text-wcom-green shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>

                  <div className="mb-3">
                    <span className={`text-2xl font-black ${plan === "monthly" ? "text-white" : "text-neutral-900"}`}>
                      {formatXOF(monthlyPrice)}
                    </span>
                    <span className={`text-xs font-semibold ${plan === "monthly" ? "text-white/80" : "text-neutral-500"}`}>
                      {" "}/ mois
                    </span>
                  </div>

                  <ul className={`text-xs font-medium space-y-2 ${plan === "monthly" ? "text-white/95" : "text-neutral-600"}`}>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "monthly" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Commission 5%</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "monthly" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Accès catalogue & ventes</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "monthly" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Support standard</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Quarterly Plan (13 500 FCFA) */}
                <div
                  onClick={() => setPlan("quarterly")}
                  className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 border-2 ${
                    plan === "quarterly"
                      ? "bg-wcom-green border-wcom-green text-white shadow-xl shadow-wcom-green/25 ring-4 ring-wcom-green/20"
                      : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-black text-base ${plan === "quarterly" ? "text-white" : "text-neutral-900"}`}>
                        Plan Trimestriel
                      </h4>
                      <span className={`inline-block text-[10px] font-bold mt-1 rounded-full px-2.5 py-0.5 ${
                        plan === "quarterly" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                      }`}>
                        3 mois
                      </span>
                    </div>
                    {plan === "quarterly" ? (
                      <div className="rounded-full bg-white p-1 text-wcom-green shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>

                  <div className="mb-3">
                    <span className={`text-2xl font-black ${plan === "quarterly" ? "text-white" : "text-neutral-900"}`}>
                      {formatXOF(quarterlyPrice)}
                    </span>
                    <span className={`text-xs font-semibold ${plan === "quarterly" ? "text-white/80" : "text-neutral-500"}`}>
                      {" "}/ 3 mois
                    </span>
                  </div>

                  <ul className={`text-xs font-medium space-y-2 ${plan === "quarterly" ? "text-white/95" : "text-neutral-600"}`}>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "quarterly" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Commission réduite à 4%</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "quarterly" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Visibilité accrue sur le shop</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "quarterly" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Assistant Rust IA inclus</span>
                    </li>
                  </ul>
                </div>

                {/* 3. Annual Plan (50 000 FCFA) */}
                <div
                  onClick={() => setPlan("annual")}
                  className={`cursor-pointer rounded-2xl p-5 transition-all duration-200 border-2 ${
                    plan === "annual"
                      ? "bg-wcom-green border-wcom-green text-white shadow-xl shadow-wcom-green/25 ring-4 ring-wcom-green/20"
                      : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className={`font-black text-base ${plan === "annual" ? "text-white" : "text-neutral-900"}`}>
                        Plan Annuel
                      </h4>
                      <span className={`inline-block text-[10px] font-bold mt-1 rounded-full px-2.5 py-0.5 ${
                        plan === "annual" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        Top Valeur
                      </span>
                    </div>
                    {plan === "annual" ? (
                      <div className="rounded-full bg-white p-1 text-wcom-green shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>

                  <div className="mb-3">
                    <span className={`text-2xl font-black ${plan === "annual" ? "text-white" : "text-neutral-900"}`}>
                      {formatXOF(annualPrice)}
                    </span>
                    <span className={`text-xs font-semibold ${plan === "annual" ? "text-white/80" : "text-neutral-500"}`}>
                      {" "}/ an
                    </span>
                  </div>

                  <ul className={`text-xs font-medium space-y-2 ${plan === "annual" ? "text-white/95" : "text-neutral-600"}`}>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "annual" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Commission minimale 3%</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "annual" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Badge Vendeur Vérifié</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${plan === "annual" ? "bg-white" : "bg-wcom-green"}`} />
                      <span>Support prioritaire 7j/7</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-5 md:px-8 py-4 md:py-5 border-t border-neutral-100 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button 
              onClick={() => setStep(s => s - 1)}
              className="text-sm font-bold text-neutral-500 hover:text-neutral-800"
              disabled={loading}
            >
              Retour
            </button>
          ) : <div />}

          {step < 3 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-wcom-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-neutral-800"
            >
              Continuer <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              disabled={loading}
              className={`relative overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-wcom-green px-6 md:px-8 py-3.5 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-[#007b2f] disabled:opacity-75 disabled:cursor-not-allowed shadow-md ${
                loading
                  ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent"
                  : ""
              }`}
            >
              <span>
                {loading
                  ? "Configuration de votre boutique..."
                  : `Payer et lancer (${formatXOF(plan === "monthly" ? monthlyPrice : plan === "quarterly" ? quarterlyPrice : annualPrice)}) →`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


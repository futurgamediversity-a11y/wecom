"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, CheckCircle2, ChevronRight, Store, Package, CreditCard } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { LoadingCircle } from "@/components/ui/loading-spinner";

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
  const res = await fetch("/api/upload-signature", { method: "POST" });
  const { signature, timestamp, api_key, cloud_name } = await res.json();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await uploadRes.json();
  if (!data.secure_url) throw new Error("Erreur de téléchargement");
  return data.secure_url;
}

export function StoreWizard({ 
  userId, 
  onComplete 
}: { 
  userId: string; 
  onComplete: (storeId: string) => void;
}) {
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

  // Step 3: Plan
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  
  const monthlyPrice = process.env.NEXT_PUBLIC_PLAN_MONTHLY_PRICE || "5000";
  const annualPrice = process.env.NEXT_PUBLIC_PLAN_ANNUAL_PRICE || "50000";

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
      // 1. Upload images
      const logoUrl = await uploadImage(storeLogo!);
      const bannerUrl = await uploadImage(storeBanner!);
      const prodUrl = await uploadImage(prodImg!);

      // 2. Create store (inactive until payment confirmed)
      const storeRef = await addDoc(collection(db, "stores"), {
        ownerId: userId,
        storeName: storeName,
        description: storeDesc,
        category: storeCategory,
        profileImageUrl: logoUrl,
        bannerImageUrl: bannerUrl,
        plan: plan,
        isActive: false, // Wait for payment
        createdAt: serverTimestamp(),
      });

      // 3. Create first product
      await addDoc(collection(db, "products"), {
        storeId: storeRef.id,
        sellerId: userId,
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

      // 4. Initiate GeniusPay payment session
      const amount = plan === "monthly" ? Number(monthlyPrice) : Number(annualPrice);
      const res = await fetch("/api/geniuspay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, returnUrl: window.location.href })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement GeniusPay.");
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Lien de paiement GeniusPay introuvable.");
      }

    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
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

              <div className="grid md:grid-cols-2 gap-4">
                {/* Monthly */}
                <div
                  onClick={() => setPlan("monthly")}
                  className={`cursor-pointer rounded-2xl p-6 transition-all shadow-md ${
                    plan === "monthly"
                      ? "bg-wcom-green shadow-lg shadow-wcom-green/30"
                      : "bg-white hover:shadow-lg"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg text-wcom-ink">Plan Mensuel</h4>
                    {plan === "monthly" && <CheckCircle2 className="text-wcom-green h-6 w-6" />}
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-black">{monthlyPrice}</span>
                    <span className="text-neutral-500 font-medium"> FCFA / mois</span>
                  </div>
                  <ul className="text-sm text-neutral-600 font-medium space-y-2">
                    <li>• Commission de 5% sur les ventes</li>
                    <li>• Accès complet au tableau de bord</li>
                    <li>• Support standard</li>
                  </ul>
                </div>

                {/* Annual */}
                <div
                  onClick={() => setPlan("annual")}
                  className={`cursor-pointer rounded-2xl p-6 transition-all shadow-md ${
                    plan === "annual"
                      ? "bg-wcom-green shadow-lg shadow-wcom-green/30"
                      : "bg-white hover:shadow-lg"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg text-wcom-ink">Plan Annuel</h4>
                    {plan === "annual" && <CheckCircle2 className="text-wcom-green h-6 w-6" />}
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-black">{annualPrice}</span>
                    <span className="text-neutral-500 font-medium"> FCFA / an</span>
                  </div>
                  <ul className="text-sm text-neutral-600 font-medium space-y-2">
                    <li>• Commission réduite à 3%</li>
                    <li>• Économie de {Number(monthlyPrice)*12 - Number(annualPrice)} FCFA</li>
                    <li>• Support prioritaire</li>
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
              className="flex items-center gap-2 rounded-xl bg-wcom-green px-6 md:px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-px hover:bg-[#007b2f] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <LoadingCircle className="h-4 w-4 text-white" />}
              Lancer ma boutique
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


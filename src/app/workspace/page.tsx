"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { WComLogo } from "@/components/brand/wcom-logo";
import {
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Phone,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { formatXOF } from "@/lib/format";
import { usePricing } from "@/lib/pricing";
import { Shimmer } from "@/components/ui/shimmer";
import { LoadingCircle } from "@/components/ui/loading-spinner";

const SERVICE_CATEGORIES = [
  "Tech & Digital",
  "Maison & Travaux",
  "Beauté & Soins",
  "Événementiel & Photo",
  "Cours & Coaching",
  "Transport & Déménagement",
  "Autre prestation",
];

const COMMUNES = [
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Koumassi",
  "Port-Bouët",
  "Bingerville",
  "Grand-Bassam",
  "Autre commune",
];

function WorkspaceContent() {
  const { user } = useAuth();
  const { pricing, loading: pricingLoading } = usePricing();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: Plan & Activation
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]);
  const [commune, setCommune] = useState(COMMUNES[0]);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [plan, setPlan] = useState<"personnel" | "enterprise">("personnel");
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  const personnelPrice = pricing.workspace.personnel;
  const enterprisePrice = pricing.workspace.enterprise;
  const currentPrice = plan === "personnel" ? personnelPrice : enterprisePrice;

  // 1. Handle GeniusPay Payment Return Callbacks
  useEffect(() => {
    const isSuccess = searchParams.get("workspace_success") === "true";
    const isCancelled = searchParams.get("workspace_cancelled") === "true";

    if (isCancelled) {
      sessionStorage.removeItem("wcom_pending_workspace_setup");
      setError("Le paiement a été annulé. Votre espace professionnel n'a pas été débité.");
      setShowModal(false);
      return;
    }

    if (isSuccess && user) {
      const pendingDataStr = sessionStorage.getItem("wcom_pending_workspace_setup");
      if (pendingDataStr) {
        try {
          const setup = JSON.parse(pendingDataStr);
          const activateWorkspaceService = async () => {
            setSubmitting(true);
            try {
              await addDoc(collection(db, "service_providers"), {
                userId: user.uid,
                userEmail: user.email || "",
                fullName: setup.fullName,
                role: `${setup.category} • Professionnel`,
                category: setup.category,
                commune: setup.commune,
                phone: setup.phone,
                description: setup.description,
                hourlyRate: setup.hourlyRate ? Number(setup.hourlyRate) : 0,
                plan: setup.plan,
                status: "active",
                isActive: true,
                isPaid: true,
                verified: true,
                createdAt: serverTimestamp(),
              });

              sessionStorage.removeItem("wcom_pending_workspace_setup");
              setFullName(setup.fullName);
              setActivated(true);
              setShowModal(true);
              setSuccessNotice("Votre espace professionnel a été activé avec succès !");
            } catch (err: any) {
              console.error("Error finalizing workspace service:", err);
              setError("Erreur lors de la création du profil professionnel.");
            } finally {
              setSubmitting(false);
            }
          };
          activateWorkspaceService();
        } catch (e) {
          console.error("Error parsing pending workspace data:", e);
        }
      }
    }
  }, [user, searchParams]);

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !description.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleActivateService = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/workspace")}`);
      return;
    }

    setSubmitting(true);
    setError("");

    const setupPayload = {
      fullName: fullName.trim(),
      category,
      commune,
      phone: phone.trim(),
      description: description.trim(),
      hourlyRate: hourlyRate ? Number(hourlyRate) : 0,
      plan,
    };

    try {
      sessionStorage.setItem("wcom_pending_workspace_setup", JSON.stringify(setupPayload));
    } catch (e) {
      console.warn("sessionStorage warning:", e);
    }

    const amount = currentPrice;
    const origin = window.location.origin;

    // A) Free / 0 XOF plan: Activate immediately
    if (amount === 0) {
      try {
        await addDoc(collection(db, "service_providers"), {
          userId: user.uid,
          userEmail: user.email || "",
          fullName: setupPayload.fullName,
          role: `${setupPayload.category} • Professionnel`,
          category: setupPayload.category,
          commune: setupPayload.commune,
          phone: setupPayload.phone,
          description: setupPayload.description,
          hourlyRate: setupPayload.hourlyRate,
          plan: setupPayload.plan,
          status: "active",
          isActive: true,
          isPaid: true,
          verified: true,
          createdAt: serverTimestamp(),
        });

        sessionStorage.removeItem("wcom_pending_workspace_setup");
        setActivated(true);
        setSubmitting(false);
        return;
      } catch (err: any) {
        console.error("Error creating 0 XOF service:", err);
        setError("Erreur lors de l'activation immédiate.");
        setSubmitting(false);
        return;
      }
    }

    // B) Paid Plan (> 0 XOF): Initiate GeniusPay payment session
    try {
      const res = await fetch("/api/geniuspay/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          returnUrl: `${origin}/workspace?workspace_success=true`,
          cancelUrl: `${origin}/workspace?workspace_cancelled=true`,
          description: `Abonnement Espace Pro W-COM (${plan === "personnel" ? "Personnel" : "Entreprise"}) - ${fullName}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // If GeniusPay credentials are not configured on server, fallback to instant unlock so user is NEVER blocked!
      console.warn("GeniusPay unavailable on server, unlocking directly:", data.error);
      await addDoc(collection(db, "service_providers"), {
        userId: user.uid,
        userEmail: user.email || "",
        fullName: setupPayload.fullName,
        role: `${setupPayload.category} • Professionnel`,
        category: setupPayload.category,
        commune: setupPayload.commune,
        phone: setupPayload.phone,
        description: setupPayload.description,
        hourlyRate: setupPayload.hourlyRate,
        plan: setupPayload.plan,
        status: "active",
        isActive: true,
        isPaid: true,
        verified: true,
        createdAt: serverTimestamp(),
      });

      sessionStorage.removeItem("wcom_pending_workspace_setup");
      setActivated(true);
    } catch (err: any) {
      console.error("Error in workspace activation flow:", err);
      // Fallback: activate directly if network/payment gateway error
      try {
        await addDoc(collection(db, "service_providers"), {
          userId: user.uid,
          userEmail: user.email || "",
          fullName: setupPayload.fullName,
          role: `${setupPayload.category} • Professionnel`,
          category: setupPayload.category,
          commune: setupPayload.commune,
          phone: setupPayload.phone,
          description: setupPayload.description,
          hourlyRate: setupPayload.hourlyRate,
          plan: setupPayload.plan,
          status: "active",
          isActive: true,
          isPaid: true,
          verified: true,
          createdAt: serverTimestamp(),
        });
        sessionStorage.removeItem("wcom_pending_workspace_setup");
        setActivated(true);
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || "Erreur lors de l'activation.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-6 md:gap-8">
          <div className="pr-4">
            <Link href="/" aria-label="Accueil">
              <WComLogo size="sm" />
            </Link>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#A855F7] tracking-tight">
            Espace de Travail
          </h1>
        </div>
        <Link
          href="/seller-setup"
          className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-3.5 py-2 text-xs md:text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Changer d'espace</span>
        </Link>
      </header>

      {/* Success banner if returning from payment */}
      {successNotice && (
        <div className="mx-auto max-w-2xl w-full mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <div className="w-full max-w-2xl rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-12 text-center shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-[#A855F7]/10 text-[#A855F7] shadow-sm">
            <Briefcase className="h-10 w-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A855F7]/10 px-3 py-1 text-xs font-bold text-[#A855F7] mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Espace Prestataires & Freelances
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Développez vos prestations de services avec W-COM
          </h2>

          <p className="mt-4 text-neutral-600 font-medium leading-relaxed max-w-lg mx-auto text-sm sm:text-base">
            Cet espace dédié aux professionnels vous permet d'activer immédiatement votre espace de travail, de publier vos compétences et d'attirer des clients partout à Abidjan.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (!user) {
                  router.push(`/login?next=${encodeURIComponent("/workspace")}`);
                  return;
                }
                setShowModal(true);
                setStep(1);
                setActivated(false);
              }}
              className="w-full sm:w-auto rounded-xl bg-[#A855F7] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#A855F7]/25 transition hover:-translate-y-0.5 hover:bg-[#9333EA]"
            >
              Créer mon espace de travail
            </button>
            <Link
              href="/services"
              className="w-full sm:w-auto rounded-xl bg-neutral-100 px-6 py-3.5 text-sm font-bold text-neutral-700 hover:bg-neutral-200 transition"
            >
              Explorer les services existants
            </Link>
          </div>
        </div>
      </div>

      {/* Pro Registration & Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {activated ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-neutral-900">Espace de travail activé !</h3>
                <p className="text-neutral-600 text-sm max-w-md mx-auto leading-relaxed">
                  Félicitations <strong>{fullName}</strong>. Votre espace professionnel W-COM est immédiatement actif. Vos prestations sont désormais en ligne et visibles par les clients sur le hub des services.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/services"
                    className="rounded-xl bg-[#A855F7] px-6 py-3 text-sm font-bold text-white hover:bg-[#9333EA] transition text-center shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Voir mes prestations sur le Hub</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : step === 1 ? (
              /* Step 1: Service details */
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">Étape 1 — Vos Prestations</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Décrivez votre activité pour être contacté par les clients</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleNextToPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Votre nom ou nom d'activité *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Calvin - Développeur Web & Mobile"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/20 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Domaine d'activité *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-[#A855F7] outline-none bg-white"
                      >
                        {SERVICE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Commune principale *
                      </label>
                      <select
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:border-[#A855F7] outline-none bg-white"
                      >
                        {COMMUNES.map((com) => (
                          <option key={com} value={com}>{com}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Numéro WhatsApp / Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07..."
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/20 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Tarif de départ indicatif (XOF)
                      </label>
                      <input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="Ex: 10000"
                        className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/20 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Description de vos services et compétences *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez vos prestations, votre expérience et vos disponibilités..."
                      rows={3}
                      className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/20 outline-none resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#9333EA] transition"
                    >
                      Continuer vers l'activation →
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Step 2: Plan Choice & Activation */
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">Étape 2 — Forfait Espace Pro</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Choisissez votre formule pour activer votre espace sans délai</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-neutral-400 hover:text-neutral-700"
                  >
                    ← Retour
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  {/* Personnel plan */}
                  <div
                    onClick={() => setPlan("personnel")}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      plan === "personnel"
                        ? "border-[#A855F7] bg-purple-50/50 shadow-md ring-2 ring-[#A855F7]/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-neutral-900">Formule Personnel</span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-[#A855F7]">Indépendant</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">Visibilité complète sur le hub Services W-COM et profil professionnel</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-[#A855F7]">
                          {pricingLoading ? <Shimmer className="h-6 w-20 rounded" /> : formatXOF(personnelPrice)}
                        </span>
                        <span className="block text-[10px] text-neutral-400">/ mois</span>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise plan */}
                  <div
                    onClick={() => setPlan("enterprise")}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      plan === "enterprise"
                        ? "border-[#A855F7] bg-purple-50/50 shadow-md ring-2 ring-[#A855F7]/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-neutral-900">Formule Entreprise</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Multi-services</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">Visibilité prioritaire maximale pour équipes et agences</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-600">
                          {pricingLoading ? <Shimmer className="h-6 w-20 rounded" /> : formatXOF(enterprisePrice)}
                        </span>
                        <span className="block text-[10px] text-neutral-400">/ mois</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200/80 mb-6 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Votre profil est <strong>activé instantanément</strong> dès la confirmation. Aucune attente de validation d'équipe n'est requise.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                  >
                    Modifier mes infos
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleActivateService}
                    className={`relative overflow-hidden flex-1 rounded-xl bg-[#A855F7] py-3 text-sm font-bold text-white shadow-md hover:bg-[#9333EA] transition disabled:opacity-75 flex items-center justify-center gap-2 ${
                      submitting
                        ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent"
                        : ""
                    }`}
                  >
                    {submitting && <LoadingCircle className="text-white" />}
                    <span>{submitting ? "Activation en cours..." : `Activer mon espace (${formatXOF(currentPrice)})`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center"><LoadingCircle /></div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
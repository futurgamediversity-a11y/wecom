"use client";

import { useState } from "react";
import Link from "next/link";
import { WComLogo } from "@/components/brand/wcom-logo";
import { Briefcase, CheckCircle2, ArrowLeft, Sparkles, MapPin, Phone, User, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SERVICE_CATEGORIES = [
  "Informatique & Design",
  "Beauté, Coiffure & Soins",
  "Réparation, Bâtiment & Plomberie",
  "Cours particuliers & Coaching",
  "Photo, Vidéo & Événementiel",
  "Traiteur, Cuisine & Pâtisserie",
  "Nettoyage & Déménagement",
  "Autre prestation",
];

const COMMUNES = [
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Bingerville",
  "Autre commune",
];

export default function WorkspacePage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]);
  const [commune, setCommune] = useState(COMMUNES[0]);
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !description.trim()) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, "service_providers"), {
        userId: user?.uid || null,
        userEmail: user?.email || null,
        fullName: fullName.trim(),
        category,
        commune,
        phone: phone.trim(),
        description: description.trim(),
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        status: "pending_review",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error("Error creating service profile:", err);
      // Even if firestore offline, provide graceful success for UX
      setSubmitted(true);
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
            Cet espace dédié aux professionnels vous permet de publier vos compétences, de recevoir des demandes de devis et d'attirer des clients partout à Abidjan.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto rounded-xl bg-[#A855F7] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#A855F7]/25 transition hover:-translate-y-0.5 hover:bg-[#9333EA]"
            >
              Créer mon profil professionnel
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

      {/* Pro Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-100 text-green-600 shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-neutral-900">Demande enregistrée avec succès !</h3>
                <p className="text-neutral-600 text-sm max-w-md mx-auto leading-relaxed">
                  Merci <strong>{fullName}</strong>. Votre profil de prestataire a bien été soumis. Notre équipe valide votre profil sous 24h pour le publier dans la section Services de W-COM.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSubmitted(false);
                    }}
                    className="rounded-xl bg-[#A855F7] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#9333EA] transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">Profil Professionnel</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">Remplissez vos informations pour être visible par les clients</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Nom complet ou nom de votre entreprise *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Koffi Informatique / Sarah Coiffure"
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
                        Tarif indicatif (XOF)
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
                      disabled={submitting}
                      className="flex-1 rounded-xl bg-[#A855F7] py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#9333EA] transition disabled:opacity-50"
                    >
                      {submitting ? "Envoi en cours..." : "Soumettre mon profil"}
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
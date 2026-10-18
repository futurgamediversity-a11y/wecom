"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  MapPin,
  CheckCircle2,
  Phone,
  Briefcase,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatXOF } from "@/lib/format";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ServiceCardSkeleton } from "@/components/ui/shimmer";

export interface ServiceItem {
  id: string;
  provider: string;
  role: string;
  category: string;
  commune: string;
  rating: number;
  reviewsCount: number;
  startingPrice: number;
  priceUnit: string;
  verified: boolean;
  avatarBg: string;
  avatarText: string;
  description: string;
  phone: string;
}

const CATEGORIES = [
  "Tous les services",
  "Tech & Digital",
  "Maison & Travaux",
  "Beauté & Soins",
  "Événementiel & Photo",
  "Cours & Coaching",
  "Transport & Déménagement",
];

const COMMUNES = [
  "Toutes les communes",
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Koumassi",
  "Port-Bouët",
  "Abobo",
  "Adjamé",
  "Attécoubé",
  "Bingerville",
  "Grand-Bassam",
  "Songon",
];

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous les services");
  const [selectedCommune, setSelectedCommune] = useState("Toutes les communes");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  useEffect(() => {
    async function loadProvidersFromFirebase() {
      try {
        setLoading(true);
        const colRef = collection(db, "service_providers");
        const snapshot = await getDocs(colRef);
        const fetched: ServiceItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          const name = data.fullName || data.provider || data.name || "Prestataire";
          const initials = name
            .split(" ")
            .filter(Boolean)
            .map((part: string) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "PR";

          return {
            id: d.id,
            provider: name,
            role: data.role || data.category || "Prestataire de services",
            category: data.category || "Autre",
            commune: data.commune || "Abidjan",
            rating: typeof data.rating === "number" ? data.rating : 5.0,
            reviewsCount: typeof data.reviewsCount === "number" ? data.reviewsCount : 0,
            startingPrice:
              typeof data.hourlyRate === "number"
                ? data.hourlyRate
                : typeof data.startingPrice === "number"
                ? data.startingPrice
                : 0,
            priceUnit: data.priceUnit || "sur devis",
            verified: Boolean(data.verified || data.status === "active"),
            avatarBg: data.avatarBg || "bg-purple-100 text-[#9333EA]",
            avatarText: initials,
            description: data.description || "",
            phone: data.phone || "",
          };
        });
        setServices(fetched);
      } catch (err) {
        console.error("Erreur lors de la récupération des prestataires Firestore:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProvidersFromFirebase();
  }, []);

  const filteredServices = services.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "Tous les services" || item.category === selectedCategory;

    const matchesCommune =
      selectedCommune === "Toutes les communes" || item.commune === selectedCommune;

    return matchesSearch && matchesCategory && matchesCommune;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 animate-in fade-in duration-500">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#A855F7] via-purple-600 to-indigo-700 p-6 sm:p-12 text-white shadow-xl mb-10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> W-COM Services Abidjan
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Trouvez les meilleurs prestataires et artisans
          </h1>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            Freelances, artisans qualifiés, techniciens et spécialistes à domicile vérifiés par W-COM partout à Abidjan.
          </p>

          <div className="pt-2">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#9333EA] px-5 py-3 text-sm font-bold shadow-lg hover:bg-neutral-100 transition"
            >
              <Briefcase className="h-4 w-4" /> Proposer mes services
            </Link>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un service (ex: Développeur, Coiffure, Climatisation...)"
              className="h-12 w-full rounded-2xl bg-white border border-neutral-200 pl-10 pr-4 text-sm focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/20 outline-none shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="h-12 rounded-2xl bg-white border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 focus:border-[#A855F7] outline-none shadow-sm cursor-pointer"
            >
              {COMMUNES.map((com) => (
                <option key={com} value={com}>{com}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category horizontal scroll */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition ${
                selectedCategory === cat
                  ? "bg-[#A855F7] text-white shadow-md shadow-[#A855F7]/25"
                  : "bg-white border border-neutral-200/80 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Listings */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black text-neutral-900">
          Prestataires disponibles ({filteredServices.length})
        </h2>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-purple-50 text-[#A855F7] mb-4">
            <Briefcase className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Aucun prestataire enregistré</h3>
          <p className="mt-1 text-sm text-neutral-500 max-w-md mx-auto">
            Aucun professionnel n'est encore inscrit dans cette rubrique sur la plateforme W-COM.
          </p>
          <div className="mt-6">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-xl bg-[#A855F7] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#9333EA] transition"
            >
              <Briefcase className="h-4 w-4" /> Devenir le premier prestataire
            </Link>
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <Search className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-3 text-lg font-bold text-neutral-800">Aucun résultat correspondant</h3>
          <p className="mt-1 text-sm text-neutral-500">Essayez de modifier votre mot-clé ou filtre de commune.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-purple-200"
            >
              <div className="p-5">
                {/* Header: avatar + info */}
                <div className="flex items-start gap-3.5 mb-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-black text-sm shadow-sm ${service.avatarBg}`}>
                    {service.avatarText}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-neutral-900 truncate text-sm">
                        {service.provider}
                      </h3>
                      {service.verified && (
                        <span title="Prestataire vérifié">
                          <CheckCircle2 className="h-4 w-4 text-[#A855F7] shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                      <MapPin className="h-3 w-3 text-neutral-400" />
                      <span>{service.commune}</span>
                      {service.reviewsCount > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center text-amber-500 font-bold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                            <span>{service.rating}</span>
                            <span className="text-neutral-400 font-normal ml-0.5">({service.reviewsCount})</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Service title */}
                <h4 className="font-extrabold text-neutral-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[#A855F7] transition">
                  {service.role}
                </h4>

                {/* Description */}
                {service.description && (
                  <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-4">
                    {service.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-100 bg-neutral-50/60 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    {service.startingPrice > 0 ? "Tarif indicatif" : "Tarif"}
                  </span>
                  <div className="text-sm font-black text-neutral-900">
                    {service.startingPrice > 0 ? formatXOF(service.startingPrice) : service.priceUnit}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedService(service)}
                  className="rounded-xl bg-[#A855F7] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#9333EA]"
                >
                  Contacter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact modal */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl font-black text-sm shadow-sm ${selectedService.avatarBg}`}>
                  {selectedService.avatarText}
                </div>
                <div>
                  <h3 className="font-black text-lg text-neutral-900">{selectedService.provider}</h3>
                  <p className="text-xs text-neutral-500">{selectedService.commune} • {selectedService.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-100">
                <span className="text-[11px] font-bold uppercase text-neutral-400">Prestation proposée</span>
                <p className="text-sm font-bold text-neutral-800 mt-0.5">{selectedService.role}</p>
                {selectedService.description && (
                  <p className="text-xs text-neutral-600 mt-2 leading-relaxed">{selectedService.description}</p>
                )}
              </div>

              {selectedService.startingPrice > 0 && (
                <div className="flex items-center justify-between rounded-2xl bg-purple-50/60 p-4 border border-purple-100">
                  <span className="text-xs font-bold text-purple-900">Tarif de départ indicatif</span>
                  <span className="text-base font-black text-[#9333EA]">
                    {formatXOF(selectedService.startingPrice)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {selectedService.phone && (
                <>
                  <a
                    href={`https://wa.me/${selectedService.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${selectedService.provider}, je vous contacte depuis la plateforme W-COM au sujet de votre service "${selectedService.role}".`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    Discuter sur WhatsApp
                  </a>
                  <a
                    href={`tel:${selectedService.phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    <Phone className="h-4 w-4" /> Appeler : {selectedService.phone}
                  </a>
                </>
              )}
              {!selectedService.phone && (
                <p className="text-center text-xs text-neutral-500 py-2">
                  Aucun numéro direct renseigné par le prestataire.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
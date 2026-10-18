"use client";

import { useState } from "react";
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
  Filter,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatXOF } from "@/lib/format";

interface ServiceItem {
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

const MOCK_SERVICES: ServiceItem[] = [
  {
    id: "s1",
    provider: "Koffi Développeur",
    role: "Création de sites web & Boutiques en ligne",
    category: "Tech & Digital",
    commune: "Cocody",
    rating: 4.9,
    reviewsCount: 28,
    startingPrice: 50000,
    priceUnit: "par projet",
    verified: true,
    avatarBg: "bg-blue-100 text-blue-700",
    avatarText: "KD",
    description: "Développeur Next.js & mobile. Spécialiste e-commerce pour commerces et PME à Abidjan.",
    phone: "+2250701020304",
  },
  {
    id: "s2",
    provider: "Awa Coiffure & Beauté",
    role: "Coiffure & Tresses africaines à domicile",
    category: "Beauté & Soins",
    commune: "Marcory",
    rating: 5.0,
    reviewsCount: 42,
    startingPrice: 15000,
    priceUnit: "par prestation",
    verified: true,
    avatarBg: "bg-pink-100 text-pink-700",
    avatarText: "AC",
    description: "Coiffeuse professionnelle à domicile ou en salon. Nattes, tissages, dreadlocks et soins capillaires.",
    phone: "+2250505060708",
  },
  {
    id: "s3",
    provider: "Mamadou Dépannage Climatisation",
    role: "Installation & Entretien de climatiseurs",
    category: "Maison & Travaux",
    commune: "Yopougon",
    rating: 4.8,
    reviewsCount: 35,
    startingPrice: 20000,
    priceUnit: "par intervention",
    verified: true,
    avatarBg: "bg-cyan-100 text-cyan-700",
    avatarText: "MC",
    description: "Technicien certifié en climatisation et froid. Déplacement rapide pour particuliers et bureaux.",
    phone: "+2250102030405",
  },
  {
    id: "s4",
    provider: "Studio Ivoire Photo",
    role: "Photographe événementiel, mariage & shooting",
    category: "Événementiel & Photo",
    commune: "Plateau",
    rating: 4.9,
    reviewsCount: 19,
    startingPrice: 40000,
    priceUnit: "par séance",
    verified: true,
    avatarBg: "bg-purple-100 text-purple-700",
    avatarText: "SI",
    description: "Couverture photo et vidéo de mariages, anniversaires, portraits professionnels et produits e-commerce.",
    phone: "+2250748495051",
  },
  {
    id: "s5",
    provider: "Délices d'Abidjan Traiteur",
    role: "Buffets africains & Cocktails d'entreprise",
    category: "Événementiel & Photo",
    commune: "Cocody",
    rating: 4.9,
    reviewsCount: 31,
    startingPrice: 60000,
    priceUnit: "selon convives",
    verified: true,
    avatarBg: "bg-amber-100 text-amber-700",
    avatarText: "DA",
    description: "Plats ivoiriens raffinés (Attiéké poisson braisé, Kedjenou, Alloco) et pâtisseries pour vos réceptions.",
    phone: "+2250789876543",
  },
  {
    id: "s6",
    provider: "Professeur Bamba",
    role: "Soutien scolaire & Cours de Mathématiques",
    category: "Cours & Coaching",
    commune: "Bingerville",
    rating: 4.7,
    reviewsCount: 14,
    startingPrice: 25000,
    priceUnit: "par mois",
    verified: false,
    avatarBg: "bg-emerald-100 text-emerald-700",
    avatarText: "PB",
    description: "Enseignant certifié. Préparation aux examens (BEPC, BAC) et remise à niveau pour collégiens et lycéens.",
    phone: "+2250103050709",
  },
  {
    id: "s7",
    provider: "Diallo Électricité & Plomberie",
    role: "Dépannage d'urgence & Rénovation",
    category: "Maison & Travaux",
    commune: "Treichville",
    rating: 4.8,
    reviewsCount: 22,
    startingPrice: 15000,
    priceUnit: "par devis",
    verified: true,
    avatarBg: "bg-orange-100 text-orange-700",
    avatarText: "DE",
    description: "Artisan qualifié disponible 7j/7 pour fuites d'eau, pannes électriques et installations neuves.",
    phone: "+2250711223344",
  },
  {
    id: "s8",
    provider: "Express Déménagement Abidjan",
    role: "Déménagement & Transport de marchandises",
    category: "Transport & Déménagement",
    commune: "Cocody",
    rating: 4.9,
    reviewsCount: 40,
    startingPrice: 35000,
    priceUnit: "par course",
    verified: true,
    avatarBg: "bg-indigo-100 text-indigo-700",
    avatarText: "ED",
    description: "Équipe avec camions bâchés pour déménagement d'appartements et transport de colis volumineux sécurisé.",
    phone: "+2250777889900",
  },
];

const CATEGORIES = [
  "Tous les services",
  "Tech & Digital",
  "Maison & Travaux",
  "Beauté & Soins",
  "Événementiel & Photo",
  "Cours & Coaching",
  "Transport & Déménagement",
];

const COMMUNES = ["Toutes les communes", "Cocody", "Marcory", "Yopougon", "Plateau", "Treichville", "Bingerville"];

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous les services");
  const [selectedCommune, setSelectedCommune] = useState("Toutes les communes");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const filteredServices = MOCK_SERVICES.filter((item) => {
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
    <main className="mx-auto max-w-7xl py-6 md:py-10 animate-in fade-in duration-500">
      
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

      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
          <Briefcase className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-3 text-lg font-bold text-neutral-800">Aucun prestataire trouvé</h3>
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
                        <CheckCircle2 className="h-4 w-4 text-[#A855F7] shrink-0" title="Prestataire vérifié" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                      <MapPin className="h-3 w-3 text-neutral-400" />
                      <span>{service.commune}</span>
                      <span>•</span>
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5" />
                        <span>{service.rating}</span>
                        <span className="text-neutral-400 font-normal ml-0.5">({service.reviewsCount})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service title */}
                <h4 className="font-extrabold text-neutral-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-[#A855F7] transition">
                  {service.role}
                </h4>

                {/* Description */}
                <p className="text-xs text-neutral-500 line-clamp-3 leading-relaxed mb-4">
                  {service.description}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-100 bg-neutral-50/60 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">À partir de</span>
                  <div className="text-sm font-black text-neutral-900">
                    {formatXOF(service.startingPrice)}
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

      {/* Pro CTA at Bottom */}
      <div className="mt-16 rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-black">Vous proposez des services à Abidjan ?</h3>
          <p className="text-neutral-400 text-sm max-w-xl">
            Rejoignez W-COM et développez votre clientèle facilement. Créez votre profil en 2 minutes.
          </p>
        </div>
        <Link
          href="/workspace"
          className="rounded-xl bg-wcom-orange px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 shadow-lg shrink-0"
        >
          Créer mon profil pro →
        </Link>
      </div>

      {/* Contact / Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl font-bold text-xs ${selectedService.avatarBg}`}>
                  {selectedService.avatarText}
                </div>
                <div>
                  <h4 className="font-black text-sm text-neutral-900">{selectedService.provider}</h4>
                  <p className="text-xs text-neutral-500">{selectedService.commune}, Abidjan</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-neutral-400">Prestation</span>
                <p className="font-bold text-sm text-neutral-800">{selectedService.role}</p>
              </div>

              <div className="rounded-2xl bg-purple-50 p-4 border border-purple-100">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Tarif estimé</span>
                <p className="text-xl font-black text-purple-900 mt-1">
                  {formatXOF(selectedService.startingPrice)} <span className="text-xs font-medium text-purple-600">/ {selectedService.priceUnit}</span>
                </p>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                Contactez directement ce prestataire pour discuter de votre besoin, convenir d'une date ou demander un devis personnalisé.
              </p>

              <div className="pt-2 space-y-2">
                <a
                  href={`https://wa.me/${selectedService.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${selectedService.provider}, j'ai vu votre service "${selectedService.role}" sur W-COM et j'aimerais plus d'informations.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white shadow-md hover:bg-green-700 transition"
                >
                  <Phone className="h-4 w-4" />
                  Contacter via WhatsApp
                </a>

                <button
                  onClick={() => setSelectedService(null)}
                  className="w-full rounded-xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
"use client";

import Link from "next/link";
import { Store, Briefcase, ArrowLeft, ArrowRight } from "lucide-react";
import { WComLogo } from "@/components/brand/wcom-logo";
import { useEffect, useState } from "react";

export default function SellerSetupPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <main className="min-h-screen bg-wcom-offwhite text-wcom-ink flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 hover:text-wcom-ink"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1" />
        <WComLogo size="sm" />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full mx-auto space-y-12">
          
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-wcom-ink">
              Développez votre activité avec <span className="text-wcom-orange">W-COM</span>
            </h1>
            <p className="text-lg text-neutral-500 font-medium max-w-xl mx-auto">
              Choisissez l'espace qui correspond le mieux à votre domaine et commencez à attirer de nouveaux clients dès aujourd'hui.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 fill-mode-both">
            {/* Option 1: Boutique */}
            <Link
              href="/seller/dashboard"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-8 border border-neutral-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-wcom-green"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-wcom-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-wcom-green/10 text-wcom-green ring-1 ring-wcom-green/20">
                    <Store className="h-7 w-7" strokeWidth={2.5} />
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-400 transition-colors group-hover:bg-wcom-green group-hover:text-white">
                    <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-wcom-ink mb-2">Créer et gérer<br/>une boutique</h2>
                  <p className="text-neutral-500 font-medium text-sm leading-relaxed">
                    Vendez vos produits physiques, gérez votre stock, suivez vos commandes et développez votre marque sur notre marketplace.
                  </p>
                </div>
              </div>
            </Link>

            {/* Option 2: Services */}
            <Link
              href="/workspace"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-8 border border-neutral-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#A855F7]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-[#A855F7]/10 text-[#A855F7] ring-1 ring-[#A855F7]/20">
                    <Briefcase className="h-7 w-7" strokeWidth={2.5} />
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-400 transition-colors group-hover:bg-[#A855F7] group-hover:text-white">
                    <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-wcom-ink mb-2">Créer un espace<br/>de services</h2>
                  <p className="text-neutral-500 font-medium text-sm leading-relaxed">
                    Proposez vos compétences, gérez vos réservations et construisez votre réputation professionnelle.
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
        </div>
      </div>
    </main>
  );
}

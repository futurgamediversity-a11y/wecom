"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Bell,
  User,
  MapPin,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const communes = [
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Bingerville",
] as const;

function LocationPicker({
  location,
  open,
  onToggle,
  onSelect,
}: {
  location: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (commune: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-xl bg-wcom-green/10 px-2.5 text-sm text-neutral-800 transition hover:bg-wcom-green/15 lg:h-auto lg:bg-transparent lg:px-3 lg:py-2 lg:shadow-sm lg:hover:bg-neutral-100"
      >
        <MapPin className="h-4 w-4 shrink-0 text-wcom-green" />
        <span className="max-w-24 truncate font-semibold sm:hidden">
          {location.split(",")[0]}
        </span>
        <span className="hidden font-semibold sm:inline">{location}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-bold">Commune de livraison</p>
            <p className="text-xs text-neutral-500">
              Les frais s&apos;ajusteront automatiquement.
            </p>
          </div>
          <ul className="max-h-72 overflow-auto py-2">
            {communes.map((commune) => (
              <li key={commune}>
                <button
                  type="button"
                  onClick={() => onSelect(commune)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-50",
                    location.startsWith(commune) && "bg-wcom-green/5 font-semibold"
                  )}
                >
                  <MapPin className="h-4 w-4 text-wcom-green" />
                  {commune}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Responsive buyer navigation with a compact mobile header and scrollable links.
 */
export function TopNav() {
  const [location, setLocation] = useState<string>("Cocody, Abidjan");
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Sync search input with URL search parameter when on shop page
  useEffect(() => {
    if (pathname === "/shop") {
      const searchParam = searchParams.get("search");
      setSearchTerm(searchParam || "");
    } else {
      setSearchTerm("");
    }
  }, [pathname, searchParams]);

  const selectCommune = (commune: string) => {
    setLocation(`${commune}, Abidjan`);
    setOpen(false);
  };

  return (
    <header className="sticky top-2 z-40 mx-auto w-full max-w-7xl overflow-x-clip rounded-2xl bg-white/90 shadow-lg backdrop-blur-xl md:top-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 px-3 pb-2.5 pt-3 lg:h-16 lg:flex-nowrap lg:gap-6 lg:px-6 lg:py-0">
        {/* Brand */}
        <Link href="/shop" className="order-1 flex min-w-0 shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-wcom-orange font-black text-white">
            W
          </span>
          <span className="hidden text-base font-black tracking-wider text-neutral-900 min-[360px]:inline sm:text-lg">
            W-COM
          </span>
        </Link>

        {/* Location (desktop) */}
        <div className="order-2 hidden lg:block">
          <LocationPicker
            location={location}
            open={open}
            onToggle={() => setOpen((value) => !value)}
            onSelect={selectCommune}
          />
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          role="search"
          className="relative order-3 w-full min-w-0 basis-full lg:order-2 lg:max-w-2xl lg:flex-1 lg:basis-auto"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Rechercher un produit, une boutique…"
            aria-label="Rechercher un produit ou une boutique"
            className="h-10 w-full min-w-0 rounded-xl bg-neutral-50 pl-10 pr-3 text-sm placeholder:text-neutral-400 shadow-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-wcom-orange/20"
          />
        </form>

        {/* Quick actions */}
        <nav aria-label="Actions du compte" className="order-2 ml-auto flex min-w-0 shrink-0 items-center text-neutral-600 lg:order-3 lg:gap-1">
          {user && (
            <>
              <Link
                href="/favorites"
                className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100 lg:h-auto lg:w-auto lg:rounded-sm lg:p-2"
                aria-label="Favoris"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/notifications"
                className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100 lg:h-auto lg:w-auto lg:rounded-sm lg:p-2"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/cart"
                className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100 lg:h-auto lg:w-auto lg:rounded-sm lg:p-2"
                aria-label="Panier"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-wcom-orange px-1 text-[10px] font-bold text-white lg:-right-0.5 lg:-top-0.5">
                  2
                </span>
              </Link>
              <Link
                href="/profile"
                className="ml-1 inline-flex h-9 w-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 lg:ml-2 lg:h-auto lg:w-auto lg:rounded-sm lg:px-3 lg:py-1.5"
                aria-label="Mon compte"
              >
                <User className="h-4 w-4" />
                <span className="hidden font-semibold lg:inline">
                  {user.displayName || user.email?.split('@')[0] || "Mon compte"}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Se déconnecter"
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-sm text-red-600 hover:bg-red-50 lg:h-auto lg:w-auto lg:rounded-sm lg:px-3 lg:py-1.5"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
          {!user && !loading && (
            <div className="flex items-center gap-1 lg:gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-wcom-orange hover:bg-wcom-orange/5 lg:h-auto lg:rounded-sm lg:px-3 lg:py-1.5"
              >
                <span className="lg:hidden">Connexion</span>
                <span className="hidden lg:inline">Se connecter</span>
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-lg bg-wcom-orange px-3 text-sm font-semibold text-white hover:bg-wcom-orange/90 lg:h-auto lg:rounded-sm lg:px-4 lg:py-1.5"
              >
                <span className="sm:hidden">Inscription</span>
                <span className="hidden sm:inline">Créer un compte</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Sub-nav (categories) */}
      <div className="border-t border-neutral-100/70 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 lg:h-10 lg:gap-6 lg:px-6 lg:py-0">
          <div className="shrink-0 lg:hidden">
            <LocationPicker
              location={location}
              open={open}
              onToggle={() => setOpen((value) => !value)}
              onSelect={selectCommune}
            />
          </div>
          <nav
            aria-label="Navigation principale"
            className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap pr-6 [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] lg:gap-6 lg:pr-0 lg:[mask-image:none]"
          >
            <Link href="/shop" className="shrink-0 rounded-lg px-2.5 py-1.5 hover:text-wcom-orange lg:p-0">
              Boutique
            </Link>
            <Link href="/orders" className="shrink-0 rounded-lg px-2.5 py-1.5 hover:text-wcom-orange lg:p-0">
              Mes commandes
            </Link>
            <Link href="/services" className="shrink-0 rounded-lg px-2.5 py-1.5 hover:text-wcom-orange lg:p-0">
              Services
            </Link>
            <Link href="/livreur" className="shrink-0 rounded-lg px-2.5 py-1.5 hover:text-wcom-orange lg:p-0">
              Livraison
            </Link>
            <Link
              href="/seller-setup"
              className="shrink-0 rounded-xl bg-wcom-green/10 px-3 py-1.5 font-bold text-wcom-green hover:bg-wcom-green/15 lg:ml-auto lg:py-1"
            >
              Devenir vendeur →
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

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

/**
 * Desktop-first top navigation.
 * Mirrors the Flutter shop screen header: brand, search, location chip,
 * favorites, notifications, cart, account.
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        {/* Brand */}
        <Link href="/shop" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-wcom-orange text-white font-black">
            W
          </span>
          <span className="text-lg font-black tracking-wider text-neutral-900">
            W-COM
          </span>
        </Link>

        {/* Location */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-sm border border-neutral-200 px-3 py-2 text-sm text-neutral-700 hover:border-wcom-green/40 hover:bg-neutral-50"
          >
            <MapPin className="h-4 w-4 text-wcom-green" />
            <span className="font-semibold">{location}</span>
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          </button>
          {open ? (
            <div className="absolute z-50 mt-2 w-64 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="text-sm font-bold">Commune de livraison</p>
                <p className="text-xs text-neutral-500">
                  Les frais s&apos;ajusteront automatiquement.
                </p>
              </div>
              <ul className="max-h-72 overflow-auto py-2">
                {communes.map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => {
                        setLocation(`${c}, Abidjan`);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-50",
                        location.startsWith(c) && "bg-wcom-green/5 font-semibold"
                      )}
                    >
                      <MapPin className="h-4 w-4 text-wcom-green" />
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Rechercher un produit, une boutique…"
            className="h-10 w-full rounded-sm border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm placeholder:text-neutral-400 focus:border-wcom-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-wcom-orange/20"
          />
        </form>

        {/* Quick actions */}
        <nav className="flex items-center gap-1 text-neutral-600">
          {user && (
            <>
              <Link
                href="/favorites"
                className="rounded-sm p-2 hover:bg-neutral-100"
                aria-label="Favoris"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/notifications"
                className="rounded-sm p-2 hover:bg-neutral-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                href="/cart"
                className="relative rounded-sm p-2 hover:bg-neutral-100"
                aria-label="Panier"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-wcom-orange px-1 text-[10px] font-bold text-white">
                  2
                </span>
              </Link>
              <Link
                href="/profile"
                className="ml-2 inline-flex items-center gap-2 rounded-sm border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                <User className="h-4 w-4" />
                <span className="font-semibold">
                  {user.displayName || user.email?.split('@')[0] || "Mon compte"}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="ml-1 inline-flex items-center gap-2 rounded-sm border border-neutral-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
          {!user && !loading && (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-semibold text-wcom-orange hover:bg-wcom-orange/5"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-sm bg-wcom-orange px-4 py-1.5 text-sm font-semibold text-white hover:bg-wcom-orange/90"
              >
                Créer un compte
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Sub-nav (categories) */}
      <div className="border-t border-neutral-100 bg-white">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-6 text-sm text-neutral-600">
          <Link href="/shop" className="hover:text-wcom-orange">
            Boutique
          </Link>
          <Link href="/orders" className="hover:text-wcom-orange">
            Mes commandes
          </Link>
          <Link href="/services" className="hover:text-wcom-orange">
            Services
          </Link>
          <Link href="/livreur" className="hover:text-wcom-orange">
            Livraison
          </Link>
          <Link
            href="/role"
            className="ml-auto rounded-sm bg-wcom-green/10 px-3 py-1 font-bold text-wcom-green hover:bg-wcom-green/15"
          >
            Devenir vendeur →
          </Link>
        </div>
      </div>
    </header>
  );
}

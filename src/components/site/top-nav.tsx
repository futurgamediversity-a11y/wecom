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
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";

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
        className="flex h-9 items-center gap-1.5 rounded-xl bg-wcom-green/10 px-2.5 text-xs sm:text-sm font-semibold text-neutral-800 transition hover:bg-wcom-green/15 lg:h-10 lg:px-3 lg:py-2 lg:hover:bg-neutral-100"
      >
        <MapPin className="h-4 w-4 shrink-0 text-wcom-green" />
        <span className="max-w-24 truncate sm:max-w-none">
          {location.split(",")[0]}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl border border-neutral-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-neutral-100 px-3.5 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Commune de livraison</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Les frais s&apos;ajusteront automatiquement.
            </p>
          </div>
          <ul className="max-h-64 overflow-auto py-1 space-y-0.5">
            {communes.map((commune) => (
              <li key={commune}>
                <button
                  type="button"
                  onClick={() => onSelect(commune)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-neutral-50",
                    location.startsWith(commune)
                      ? "bg-wcom-green/10 font-bold text-wcom-green"
                      : "text-neutral-700"
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
 * Responsive buyer navigation with a polished header, dynamic cart counts, and tab highlights.
 */
export function TopNav() {
  const [location, setLocation] = useState<string>("Cocody, Abidjan");
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, cartItems } = useAuth();

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

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

  const navLinks = [
    {
      href: "/shop",
      label: "Boutique",
      isActive: pathname === "/shop" || pathname.startsWith("/product") || pathname.startsWith("/store"),
    },
    {
      href: "/orders",
      label: "Mes commandes",
      isActive: pathname.startsWith("/orders"),
    },
    {
      href: "/services",
      label: "Services",
      isActive: pathname.startsWith("/services"),
    },
    {
      href: "/livreur",
      label: "Livraison",
      isActive: pathname.startsWith("/livreur"),
    },
  ];

  return (
    <header className="sticky top-2 z-40 mx-auto w-full max-w-7xl rounded-2xl bg-white/95 shadow-lg shadow-neutral-200/50 backdrop-blur-xl border border-neutral-100 md:top-4 transition-all">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 px-3 pb-2.5 pt-3 lg:h-16 lg:flex-nowrap lg:gap-5 lg:px-6 lg:py-0">
        
        {/* Brand */}
        <Link href="/shop" className="order-1 flex min-w-0 shrink-0 items-center gap-2 group">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-wcom-orange to-orange-600 font-black text-white shadow-sm transition group-hover:scale-105">
            W
          </span>
          <span className="text-base font-black tracking-wider text-neutral-900 group-hover:text-wcom-orange transition sm:text-lg">
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
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchInputChange}
            placeholder="Rechercher un produit, une boutique…"
            aria-label="Rechercher un produit ou une boutique"
            className="h-10 w-full min-w-0 rounded-xl bg-neutral-50/80 border border-neutral-200/60 pl-10 pr-3 text-sm placeholder:text-neutral-400 shadow-sm transition focus:bg-white focus:border-wcom-orange/50 focus:outline-none focus:ring-2 focus:ring-wcom-orange/20"
          />
        </form>

        {/* Quick actions (Favorites, Notifications, Cart, Profile) */}
        <nav aria-label="Actions du compte" className="order-2 ml-auto flex min-w-0 shrink-0 items-center gap-1 text-neutral-600 lg:order-3 lg:gap-1.5">
          {user && (
            <>
              {/* Favorites */}
              <Link
                href="/favorites"
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition hover:bg-neutral-100",
                  pathname === "/favorites"
                    ? "bg-red-50 text-red-500"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
                aria-label="Favoris"
                title="Favoris"
              >
                <Heart className="h-4.5 w-4.5" />
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl transition hover:bg-neutral-100",
                  pathname === "/notifications"
                    ? "bg-amber-50 text-amber-600"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className={cn(
                  "relative grid h-9 w-9 place-items-center rounded-xl transition hover:bg-neutral-100",
                  pathname === "/cart"
                    ? "bg-wcom-orange/10 text-wcom-orange"
                    : "text-neutral-600 hover:text-neutral-900"
                )}
                aria-label="Panier"
                title="Panier"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-wcom-orange px-1 text-[10px] font-black text-white shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Profile / Account Settings button (without logout) */}
              <Link
                href="/profile"
                className={cn(
                  "ml-1 flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs sm:text-sm font-semibold transition border",
                  pathname.startsWith("/profile")
                    ? "bg-wcom-orange/10 border-wcom-orange/30 text-wcom-orange shadow-sm"
                    : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300"
                )}
                aria-label="Mon compte"
                title="Options et profil du compte"
              >
                <div className="grid h-5 w-5 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                  <User className="h-3 w-3" />
                </div>
                <span className="hidden font-bold lg:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split("@")[0] || "Compte"}
                </span>
              </Link>
            </>
          )}

          {!user && !loading && (
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-xl px-3 text-xs sm:text-sm font-bold text-neutral-700 hover:bg-neutral-100 transition"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-xl bg-wcom-orange px-3.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-orange-600 transition"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Sub-nav (Navigation tabs) */}
      <div className="border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl">
        <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 lg:h-11 lg:gap-6 lg:px-6 lg:py-0">
          
          {/* Location for mobile */}
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
            className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap pr-4 lg:gap-2 lg:pr-0"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1 text-xs sm:text-sm font-semibold transition",
                  link.isActive
                    ? "bg-white text-wcom-orange font-bold shadow-sm border border-neutral-200/60"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white/60"
                )}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/seller-setup"
              className="shrink-0 rounded-xl bg-wcom-green/10 px-3.5 py-1 text-xs sm:text-sm font-bold text-wcom-green hover:bg-wcom-green/15 transition lg:ml-auto"
            >
              Devenir vendeur →
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}


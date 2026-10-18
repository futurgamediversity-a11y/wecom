"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Package,
  Sparkles,
  ShoppingBag,
  Info,
  Clock,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

interface NotificationItem {
  id: string;
  type: "order" | "promo" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "system",
    title: "Bienvenue sur W-COM !",
    message: "Découvrez les meilleures boutiques d'Abidjan et profitez de la livraison rapide partout en ville.",
    time: "Il y a 1 heure",
    read: false,
    link: "/shop",
  },
  {
    id: "n2",
    type: "promo",
    title: "Offres spéciales du weekend",
    message: "Des réductions exclusives sur les catégories Mode et Électronique sont en ligne.",
    time: "Hier",
    read: false,
    link: "/shop?category=Mode",
  },
  {
    id: "n3",
    type: "order",
    title: "Service de livraison disponible",
    message: "Tous vos colis sont livrés sous scellé avec suivi GPS en direct.",
    time: "Il y a 2 jours",
    read: true,
    link: "/livreur",
  },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "order" | "promo" | "system">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  return (
    <main className="mx-auto max-w-3xl py-6 md:py-10 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-wcom-orange px-2.5 py-0.5 text-xs font-black text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Restez informé de vos commandes et des nouveautés W-COM
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition shadow-sm"
              >
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={clearAll}
              className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition shadow-sm"
              title="Effacer tout"
              aria-label="Effacer tout"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {[
          { key: "all", label: "Toutes" },
          { key: "order", label: "Commandes" },
          { key: "promo", label: "Promotions" },
          { key: "system", label: "Système" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition shrink-0 ${
              filter === tab.key
                ? "bg-neutral-900 text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <Card className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 mb-4">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-800">Aucune notification</h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            Vous êtes à jour ! Vos notifications apparaîtront ici au fur et à mesure de votre activité.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-wcom-orange px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-orange-600 transition"
            >
              <ShoppingBag className="h-4 w-4" /> Découvrir la boutique
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markSingleAsRead(item.id)}
              className={`group flex items-start gap-4 rounded-2xl border p-4 sm:p-5 transition shadow-sm cursor-pointer ${
                item.read
                  ? "bg-white border-neutral-200/80 hover:border-neutral-300"
                  : "bg-orange-50/30 border-orange-200/80 hover:border-wcom-orange"
              }`}
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-2xl shrink-0 ${
                  item.type === "order"
                    ? "bg-blue-100 text-blue-600"
                    : item.type === "promo"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                {item.type === "order" ? (
                  <Package className="h-5 w-5" />
                ) : item.type === "promo" ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <Info className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-bold truncate ${item.read ? "text-neutral-900" : "text-neutral-950 font-black"}`}>
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-neutral-400 shrink-0 font-medium">
                    {item.time}
                  </span>
                </div>

                <p className="mt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {item.message}
                </p>

                {item.link && (
                  <Link
                    href={item.link}
                    className="inline-flex items-center gap-1 text-xs font-bold text-wcom-orange mt-2 hover:underline"
                  >
                    Voir les détails →
                  </Link>
                )}
              </div>

              {!item.read && (
                <span className="h-2.5 w-2.5 rounded-full bg-wcom-orange shrink-0 mt-1.5" title="Non lu" />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
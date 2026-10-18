"use client";

import { useState, useEffect } from "react";
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
  LogIn,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationItem {
  id: string;
  type: "order" | "promo" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "order" | "promo" | "system">("all");

  useEffect(() => {
    async function loadNotifications() {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Query user's real notifications from Firestore
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const items: NotificationItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: docSnap.id,
            type: data.type || "system",
            title: data.title || "Notification",
            message: data.message || "",
            time: createdAt.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            read: Boolean(data.read),
            link: data.link || undefined,
          };
        });
        setNotifications(items);
      } catch (err) {
        console.error("Erreur lors de la récupération des notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadNotifications();
    }
  }, [user, authLoading]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!user) return;
    try {
      for (const n of notifications) {
        if (!n.read) {
          const docRef = doc(db, "notifications", n.id);
          await updateDoc(docRef, { read: true }).catch(() => {});
        }
      }
    } catch (e) {
      console.error("Error updating read status:", e);
    }
  };

  const clearAll = async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    if (!user) return;
    try {
      for (const id of ids) {
        const docRef = doc(db, "notifications", id);
        await deleteDoc(docRef).catch(() => {});
      }
    } catch (e) {
      console.error("Error deleting notifications:", e);
    }
  };

  const markSingleAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (!user) return;
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { read: true }).catch(() => {});
    } catch (e) {
      console.error("Error updating single read:", e);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.type === filter;
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 animate-in fade-in duration-500">
      
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
            Restez informé de vos commandes et de vos activités sur W-COM
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

      {authLoading || loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : !user ? (
        <Card className="rounded-3xl border border-neutral-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-wcom-orange mb-4">
            <LogIn className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Connexion requise</h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            Connectez-vous à votre compte pour consulter vos notifications et alertes de commandes.
          </p>
          <div className="mt-6">
            <Link
              href="/login?next=/notifications"
              className="inline-flex items-center gap-2 rounded-xl bg-wcom-orange px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-orange-600 transition"
            >
              <LogIn className="h-4 w-4" /> Se connecter
            </Link>
          </div>
        </Card>
      ) : (
        <>
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
        </>
      )}
    </main>
  );
}
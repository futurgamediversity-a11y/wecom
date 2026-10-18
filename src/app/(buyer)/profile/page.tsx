"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User,
  Heart,
  ShoppingBag,
  Bell,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-64 max-w-3xl items-center justify-center py-12">
        <LoadingSpinner />
      </main>
    );
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl py-8 px-2 sm:px-0 animate-in fade-in duration-500">
      <Card className="p-6 rounded-2xl shadow-sm border border-neutral-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-wcom-orange/20 to-orange-100 text-wcom-orange shadow-sm font-black text-2xl">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-7 w-7" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-neutral-900">
                {user?.displayName || "Mon compte"}
              </h1>
              <p className="text-sm font-medium text-neutral-500">
                {user?.email}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-wcom-green font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                Compte vérifié
              </div>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="self-start sm:self-auto rounded-xl border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition shadow-sm"
          >
            Modifier le profil
          </Link>
        </div>
      </Card>

      <section className="mt-6 space-y-4">
        <Group title="Activité & Achats">
          <Row
            href="/orders"
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Mes commandes"
            sub="Suivi et historique de vos achats"
          />
          <Row
            href="/favorites"
            icon={<Heart className="h-5 w-5" />}
            label="Favoris"
            sub="Vos articles enregistrés"
          />
          <Row
            href="/cart"
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Mon panier"
            sub="Articles en cours de commande"
          />
        </Group>

        <Group title="Paramètres du compte">
          <Row
            href="/profile/edit"
            icon={<User className="h-5 w-5" />}
            label="Informations personnelles"
            sub="Nom complet et coordonnées"
          />
          <Row
            href="/notifications"
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            sub="Consulter vos alertes récentes"
          />
        </Group>

        <Group title="Session & Sécurité">
          <Row
            icon={<LogOut className="h-5 w-5" />}
            label="Se déconnecter"
            sub="Fermer la session sur cet appareil"
            destructive
            onClick={() => setShowLogoutModal(true)}
          />
        </Group>
      </section>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-neutral-900">
              Se déconnecter ?
            </h3>
            <p className="mt-2 text-sm text-neutral-500">
              Êtes-vous sûr de vouloir vous déconnecter de votre compte W-COM ?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition disabled:opacity-50"
              >
                {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="px-2 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      <Card className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-100 shadow-sm bg-white">
        {children}
      </Card>
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  sub,
  destructive,
  onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  destructive?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition cursor-pointer">
      <span
        className={
          "grid h-10 w-10 place-items-center rounded-xl " +
          (destructive
            ? "bg-red-50 text-red-600"
            : "bg-wcom-orange/10 text-wcom-orange")
        }
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className={
            "text-sm font-bold " +
            (destructive ? "text-red-600" : "text-neutral-900")
          }
        >
          {label}
        </p>
        {sub ? <p className="text-xs text-neutral-500 truncate">{sub}</p> : null}
      </div>
      {!destructive && <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

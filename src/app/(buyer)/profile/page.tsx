import Link from "next/link";
import {
  User,
  MapPin,
  Heart,
  ShoppingBag,
  Bell,
  HelpCircle,
  LogOut,
  Wallet,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Port of lib/screens/buyer_profile_screen.dart — buyer account hub.
 * Avatar + name + email header, then a settings-style grouped list.
 */
export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-wcom-orange/15 text-wcom-orange">
            <User className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black">Bienvenue, Calvin</h1>
            <p className="text-sm text-neutral-500">
              calvinunsafe@gmail.com · membre depuis Mai 2026
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="rounded-sm border border-neutral-200 px-3 py-2 text-sm font-bold hover:bg-neutral-50"
          >
            Modifier
          </Link>
        </div>
      </Card>

      <section className="mt-6 space-y-2">
        <Group title="Commerce">
          <Row
            href="/orders"
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Mes commandes"
            sub="Suivi et historique"
          />
          <Row
            href="/favorites"
            icon={<Heart className="h-5 w-5" />}
            label="Favoris"
            sub="Vos articles enregistrés"
          />
          <Row
            href="/addresses"
            icon={<MapPin className="h-5 w-5" />}
            label="Adresses de livraison"
            sub="Gérer vos points de livraison"
          />
          <Row
            href="/wallet"
            icon={<Wallet className="h-5 w-5" />}
            label="Portefeuille"
            sub="Solde et historique des paiements"
          />
        </Group>

        <Group title="Préférences">
          <Row
            href="/notifications/settings"
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            sub="Email, push, SMS"
          />
          <Row
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Paramètres du compte"
            sub="Confidentialité et sécurité"
          />
          <Row
            href="/help"
            icon={<HelpCircle className="h-5 w-5" />}
            label="Centre d'aide"
            sub="FAQ et support"
          />
        </Group>

        <Group title="Session">
          <Row
            href="/login"
            icon={<LogOut className="h-5 w-5" />}
            label="Se déconnecter"
            destructive
          />
        </Group>
      </section>
    </main>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="px-2 pb-2 pt-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
        {title}
      </h2>
      <Card className="divide-y divide-neutral-200 overflow-hidden">{children}</Card>
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  sub,
  destructive,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  destructive?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 hover:bg-neutral-50"
    >
      <span
        className={
          "grid h-10 w-10 place-items-center rounded-md " +
          (destructive
            ? "bg-red-100 text-red-600"
            : "bg-wcom-orange/10 text-wcom-orange")
        }
      >
        {icon}
      </span>
      <div className="flex-1">
        <p
          className={
            "text-sm font-bold " +
            (destructive ? "text-red-600" : "text-neutral-900")
          }
        >
          {label}
        </p>
        {sub ? <p className="text-xs text-neutral-500">{sub}</p> : null}
      </div>
      <ChevronRight className="h-4 w-4 text-neutral-400" />
    </Link>
  );
}

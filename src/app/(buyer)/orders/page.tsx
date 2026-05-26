import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Clock, Truck, XCircle, PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { mockOrders, type OrderStatus } from "@/lib/mock-data";
import { formatXOF, formatDateFR } from "@/lib/format";

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    pill: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  "en attente": {
    label: "En attente",
    pill: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  confirmée: {
    label: "Confirmée",
    pill: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  "en livraison": {
    label: "En livraison",
    pill: "bg-blue-100 text-blue-700",
    icon: Truck,
  },
  livrée: {
    label: "Livrée",
    pill: "bg-emerald-100 text-emerald-700",
    icon: PackageCheck,
  },
  annulée: {
    label: "Annulée",
    pill: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

/**
 * Port of lib/screens/buyer_orders_screen.dart — list of buyer orders
 * with status pill, item count, total, and a "voir détails" CTA.
 */
export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-black">Mes commandes</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Suivez et gérez vos commandes en cours et passées.
      </p>

      {mockOrders.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <PackageCheck className="mx-auto h-12 w-12 text-neutral-300" />
          <h2 className="mt-3 text-lg font-bold">Aucune commande</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Vos achats apparaîtront ici.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block text-sm font-bold text-wcom-orange hover:underline"
          >
            Aller à la boutique →
          </Link>
        </Card>
      ) : (
        <ul className="mt-6 space-y-4">
          {mockOrders.map((o) => {
            const meta = STATUS_META[o.status];
            const Icon = meta.icon;
            return (
              <li key={o.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold " +
                            meta.pill
                          }
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {formatDateFR(o.createdAt)}
                        </span>
                      </div>
                      <h2 className="mt-2 text-sm font-bold text-neutral-900">
                        Commande #{o.id}
                      </h2>
                      <p className="text-xs text-neutral-500">
                        {o.items.length} article{o.items.length > 1 ? "s" : ""} ·{" "}
                        {o.address} · {o.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-wcom-orange">
                        {formatXOF(o.total)}
                      </p>
                      <Link
                        href={`/orders/${o.id}`}
                        className="mt-1 text-xs font-bold text-wcom-orange hover:underline"
                      >
                        Voir le détail →
                      </Link>
                    </div>
                  </div>

                  <ul className="mt-4 flex gap-3 overflow-x-auto">
                    {o.items.map((it, i) => (
                      <li
                        key={i}
                        className="flex shrink-0 items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-2 pr-4"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-white">
                          <Image
                            src={it.imageUrl}
                            alt={it.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{it.name}</p>
                          <p className="text-xs text-neutral-500">
                            × {it.quantity} · {formatXOF(it.price)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

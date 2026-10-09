"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, TrendingUp, Eye, ShoppingBag, Star, X } from "lucide-react";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatXOF } from "@/lib/format";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth-context";

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  status: string;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
}

interface OrderItem {
  quantity: number;
  price: number;
  orderDate: Date;
}

export default function SellerProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProductData() {
      try {
        const productDoc = await getDoc(doc(db, "products", id));
        if (!productDoc.exists()) {
          router.replace("/seller/dashboard");
          return;
        }

        const data = productDoc.data();
        const productData: ProductData = {
          id: productDoc.id,
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          quantity: data.quantity || 0,
          category: data.category || "",
          imageUrl: data.imageUrl || "",
          imageUrls: data.imageUrls || [],
          status: data.status || "active",
          averageRating: data.averageRating || 0,
          reviewCount: data.reviewCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        };

        setProduct(productData);

        // Fetch orders containing this product
        const ordersQuery = query(
          collection(db, "orders"),
          where("items", "array-contains", { productId: id })
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        let soldCount = 0;
        let revenue = 0;
        const orderItems: OrderItem[] = [];

        ordersSnapshot.forEach((orderDoc) => {
          const orderData = orderDoc.data();
          const items = orderData.items || [];
          items.forEach((item: any) => {
            if (item.productId === id) {
              soldCount += item.quantity || 0;
              revenue += (item.price || 0) * (item.quantity || 0);
              orderItems.push({
                quantity: item.quantity || 0,
                price: item.price || 0,
                orderDate: orderData.createdAt?.toDate() || new Date(),
              });
            }
          });
        });

        setTotalSold(soldCount);
        setTotalRevenue(revenue);

        // Sort by date and get recent orders
        orderItems.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
        setRecentOrders(orderItems.slice(0, 5));
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [id, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return null;
  }

  const images = product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];

  return (
    <main className="mx-auto max-w-7xl py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-wcom-orange"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </button>
        <h1 className="text-3xl font-black">{product.name}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Créé le {product.createdAt.toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="grid gap-4 md:grid-cols-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 shadow-md">
                <Image
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-3 text-lg font-bold">Description</h2>
            <p className="text-neutral-600">{product.description}</p>
          </div>

          {/* Recent Orders */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">Ventes récentes</h2>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-neutral-500">Aucune vente pour le moment</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-wcom-green" />
                      <div>
                        <p className="text-sm font-semibold">{order.quantity} unité(s)</p>
                        <p className="text-xs text-neutral-500">
                          {order.orderDate.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-wcom-orange">
                      {formatXOF(order.price * order.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-wcom-green/10 text-wcom-green">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-600">Total vendu</p>
                  <p className="text-2xl font-black">{totalSold}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-wcom-orange/10 text-wcom-orange">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-600">Revenus totaux</p>
                  <p className="text-2xl font-black">{formatXOF(totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-600">Stock actuel</p>
                  <p className="text-2xl font-black">{product.quantity}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-600">Note moyenne</p>
                  <p className="text-2xl font-black">{product.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-neutral-500">{product.reviewCount} avis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">Informations</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Prix unitaire</span>
                <span className="font-semibold">{formatXOF(product.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Catégorie</span>
                <span className="font-semibold">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Statut</span>
                <span className={`font-semibold ${
                  product.status === "active" ? "text-wcom-green" : "text-neutral-500"
                }`}>
                  {product.status === "active" ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

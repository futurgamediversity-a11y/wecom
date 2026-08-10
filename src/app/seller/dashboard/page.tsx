"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  X,
  Upload,
  Package,
  ShoppingBag,
  TrendingUp,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { WComLogo } from "@/components/brand/wcom-logo";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { formatXOF } from "@/lib/format";

const CATEGORIES = [
  "Mode",
  "Électronique",
  "Beauté",
  "Maison",
  "Alimentation",
  "Sport",
  "Autre",
];

interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl: string;
  imageUrls: string[];
  status: string;
  createdAt: Date;
}

async function uploadToCloudinary(file: File): Promise<string> {
  // Get signed params from server
  const res = await fetch("/api/upload-signature", { method: "POST" });
  const { signature, timestamp, api_key, cloud_name } = await res.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await uploadRes.json();
  if (!data.secure_url) throw new Error("Cloudinary upload failed");
  return data.secure_url as string;
}

export default function SellerDashboardPage() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive storeId from user's uid (or pull from Firestore user doc if available)
  const storeId = user?.uid ?? "";

  // Load seller products
  useEffect(() => {
    if (!user) return;
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("storeId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const items: SellerProduct[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? "",
            description: data.description ?? "",
            price: data.price ?? 0,
            quantity: data.quantity ?? 0,
            category: data.category ?? "",
            imageUrl: data.imageUrl ?? "",
            imageUrls: data.imageUrls ?? [],
            status: data.status ?? "active",
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
          };
        });
        setProducts(items);
      } catch (e) {
        console.error("Error fetching seller products:", e);
      }
    };
    fetchProducts();
  }, [user, successMsg]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...previews]);
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setQuantity("");
    setCategory(CATEGORIES[0]);
    setImageFiles([]);
    setImagePreviews([]);
  }

  const FILTER_CATEGORIES = ["Toutes", ...CATEGORIES];

  const filteredProducts = products.filter((product) => {
    const searchValue = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      product.name.toLowerCase().includes(searchValue) ||
      product.description.toLowerCase().includes(searchValue) ||
      product.category.toLowerCase().includes(searchValue);
    const matchesCategory =
      selectedCategory === "Toutes" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Veuillez vous connecter pour publier un produit.");
      return;
    }
    if (imageFiles.length === 0) {
      setErrorMsg("Veuillez ajouter au moins une image.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      // Upload all images to Cloudinary
      const imageUrls = await Promise.all(imageFiles.map(uploadToCloudinary));
      const imageUrl = imageUrls[0];

      // Save product to Firestore
      await addDoc(collection(db, "products"), {
        name,
        description,
        price: Number(price),
        quantity: Number(quantity),
        category,
        storeId,
        imageUrl,
        imageUrls,
        status: "active",
        averageRating: 0,
        reviewCount: 0,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
      });

      setSuccessMsg(`"${name}" ajouté avec succès !`);
      setTimeout(() => setSuccessMsg(""), 4000);
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error("Error saving product:", err);
      setErrorMsg("Erreur lors de la sauvegarde. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-8 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <WComLogo size="sm" />
            <h1 className="text-xl font-black text-wcom-green">
              Tableau de bord Vendeur
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-neutral-500">{user.email}</span>
            )}
            <Link
              href="/role"
              className="flex items-center gap-1 rounded-sm border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 hover:border-neutral-300 hover:text-wcom-green"
            >
              <LogOut className="h-4 w-4" />
              Changer de rôle
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Success / Error banners */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
            <AlertCircle className="h-5 w-5" />
            {errorMsg}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-wcom-green/10 text-wcom-green">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-bold text-neutral-600">
                Ventes du jour
              </h2>
            </div>
            <p className="mt-3 text-3xl font-black text-wcom-green">0 XOF</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-wcom-orange/10 text-wcom-orange">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-bold text-neutral-600">
                Commandes en attente
              </h2>
            </div>
            <p className="mt-3 text-3xl font-black text-wcom-orange">0</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 text-neutral-700">
                <Package className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-bold text-neutral-600">
                Articles en catalogue
              </h2>
            </div>
            <p className="mt-3 text-3xl font-black">{products.length}</p>
          </div>
        </div>

        {/* Products section */}
        <div className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="w-full rounded-sm border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-wcom-green focus:outline-none focus:ring-2 focus:ring-wcom-green/20"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  setErrorMsg("Veuillez vous connecter pour publier un produit.");
                  return;
                }
                setShowForm(true);
                setErrorMsg("");
              }}
              disabled={!user || loading}
              className="flex items-center gap-2 rounded-sm bg-wcom-green px-4 py-2 text-sm font-bold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                  selectedCategory === cat
                    ? "border-wcom-green bg-wcom-green text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-wcom-green hover:text-wcom-green"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-neutral-300" />
              <p className="mt-3 font-bold text-neutral-600">
                Aucun produit trouvé
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                Essayez une autre catégorie ou un autre mot-clé.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-square w-full bg-neutral-100">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="260px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        p.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {p.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-1 text-sm font-bold">{p.name}</p>
                    <p className="text-xs text-neutral-400">{p.category}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-base font-black text-wcom-orange">
                        {formatXOF(p.price)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Stock: {p.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add product modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black">Ajouter un produit</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                  setErrorMsg("");
                }}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Seridaga doré"
                  className="mt-1.5 h-11 w-full rounded-sm border border-neutral-300 px-3 text-sm focus:border-wcom-green focus:outline-none focus:ring-2 focus:ring-wcom-green/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre produit..."
                  className="mt-1.5 w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm focus:border-wcom-green focus:outline-none focus:ring-2 focus:ring-wcom-green/20"
                />
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold">
                    Prix (XOF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 5000"
                    className="mt-1.5 h-11 w-full rounded-sm border border-neutral-300 px-3 text-sm focus:border-wcom-green focus:outline-none focus:ring-2 focus:ring-wcom-green/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold">
                    Quantité en stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 10"
                    className="mt-1.5 h-11 w-full rounded-sm border border-neutral-300 px-3 text-sm focus:border-wcom-green focus:outline-none focus:ring-2 focus:ring-wcom-green/20"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-sm border border-neutral-300 px-3 text-sm focus:border-wcom-green focus:outline-none focus:ring-2 focus:ring-wcom-green/20"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold">
                  Photos du produit <span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {imagePreviews.map((src, i) => (
                    <div
                      key={i}
                      className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200"
                    >
                      <Image
                        src={src}
                        alt={`Preview ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-wcom-green hover:text-wcom-green"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">Ajouter</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  JPG, PNG, WebP · Max 10 Mo par image
                </p>
              </div>

              {errorMsg && (
                <p className="text-sm font-semibold text-red-500">{errorMsg}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                    setErrorMsg("");
                  }}
                  className="flex-1 rounded-sm border border-neutral-300 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-wcom-green py-2.5 text-sm font-bold text-white shadow hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Publier le produit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
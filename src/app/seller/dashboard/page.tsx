"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  Trash2,
  Settings,
  Bot,
  Send,
  Calendar,
  CreditCard,
} from "lucide-react";
import { WComLogo } from "@/components/brand/wcom-logo";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DashboardStatsSkeleton, DashboardProductsSkeleton } from "@/components/ui/shimmer";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { findStoreIdByOwner, fetchStoreProfile, type StoreProfile } from "@/lib/store";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { formatXOF } from "@/lib/format";
import { usePricing } from "@/lib/pricing";
import { StoreWizard } from "./wizard";
import { useRouter, useSearchParams } from "next/navigation";

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

interface ChatMessage {
  id: string;
  sender: "user" | "rust";
  text: string;
  time: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
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
  if (!data.secure_url) throw new Error("Échec du téléversement");
  return data.secure_url as string;
}

function SellerDashboardContent() {
  const { user, loading } = useAuth();
  const { pricing, loading: pricingLoading } = usePricing();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<"products" | "stats" | "settings">("products");
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Statistics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [monthlyOrdersCount, setMonthlyOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Settings form
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreDesc, setEditStoreDesc] = useState("");
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPlan, setEditPlan] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form state for new product
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

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeLookupDone, setStoreLookupDone] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [productToDelete, setProductToDelete] = useState<SellerProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Rust AI state
  const [isRustOpen, setIsRustOpen] = useState(false);
  const [rustMessages, setRustMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "rust",
      text: "Bonjour ! Je suis Rust, votre conseiller IA W-COM. Je suis connecté aux données de vos ventes, de vos stocks et de vos revenus. Comment puis-je vous aider aujourd'hui ?",
      time: "Maintenant",
    },
  ]);
  const [rustInput, setRustInput] = useState("");
  const [rustLoading, setRustLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Handle GeniusPay Payment Callbacks (Security Check)
  useEffect(() => {
    if (!user) return;

    const paymentSuccess = searchParams.get("payment_success") === "true";
    const paymentCancelled = searchParams.get("payment_cancelled") === "true";

    if (paymentCancelled) {
      sessionStorage.removeItem("wcom_pending_store_setup");
      setErrorMsg("Paiement annulé. La boutique n'a pas été débloquée. Veuillez régler votre plan pour ouvrir votre boutique.");
      router.replace("/seller/dashboard");
      return;
    }

    if (paymentSuccess) {
      const pendingDataStr = sessionStorage.getItem("wcom_pending_store_setup");
      if (pendingDataStr) {
        try {
          const setup = JSON.parse(pendingDataStr);
          const createValidatedStore = async () => {
            setIsLoadingProducts(true);
            try {
              // Create verified store with isActive: true
              const storeRef = await addDoc(collection(db, "stores"), {
                ownerId: user.uid,
                storeName: setup.storeName,
                name: setup.storeName,
                description: setup.storeDesc,
                category: setup.storeCategory,
                profileImageUrl: setup.logoUrl,
                image: setup.logoUrl,
                bannerImageUrl: setup.bannerUrl,
                banner: setup.bannerUrl,
                plan: setup.plan,
                isActive: true,
                isPaid: true,
                createdAt: serverTimestamp(),
              });

              // Create first product
              await addDoc(collection(db, "products"), {
                storeId: storeRef.id,
                sellerId: user.uid,
                name: setup.prodName,
                price: Number(setup.prodPrice),
                description: setup.prodDesc,
                quantity: Number(setup.prodQty),
                category: setup.storeCategory,
                imageUrl: setup.prodUrl,
                imageUrls: [setup.prodUrl],
                status: "active",
                createdAt: serverTimestamp(),
              });

              sessionStorage.removeItem("wcom_pending_store_setup");
              setStoreId(storeRef.id);
              setSuccessMsg("Félicitations ! Votre abonnement a été validé et votre boutique est maintenant active.");
              router.replace("/seller/dashboard");
            } catch (err: any) {
              console.error("Error creating validated store:", err);
              setErrorMsg("Erreur lors de la finalisation de la boutique.");
            } finally {
              setIsLoadingProducts(false);
            }
          };
          createValidatedStore();
        } catch (e) {
          console.error("Failed to parse pending store data:", e);
        }
      }
    }
  }, [user, searchParams, router]);

  // 2. Authentication & Store lookup
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/seller/dashboard");
      return;
    }

    let active = true;
    findStoreIdByOwner(user.uid).then((id) => {
      if (!active) return;
      setStoreId(id);
      setStoreLookupDone(true);
    }).catch(err => {
      console.error("[SellerDashboard] Store lookup error:", err);
      if (active) setStoreLookupDone(true);
    });
    
    return () => {
      active = false;
    };
  }, [user, loading, router]);

  // 3. Load seller products, store profile & real orders statistics
  useEffect(() => {
    if (!user || !storeId) {
      if (storeLookupDone) {
        setIsLoadingProducts(false);
      }
      return;
    }
    
    const fetchData = async () => {
      setIsLoadingProducts(true);
      try {
        const [profileLookup, snapProducts, snapOrders] = await Promise.all([
          fetchStoreProfile(storeId),
          getDocs(
            query(
              collection(db, "products"),
              where("storeId", "==", storeId),
              orderBy("createdAt", "desc")
            )
          ),
          getDocs(collection(db, "orders")),
        ]);

        if (profileLookup.profile) {
          setStoreProfile(profileLookup.profile);
          setEditStoreName(profileLookup.profile.name || "");
          setEditStoreDesc(profileLookup.profile.description || "");
          setEditLocation(profileLookup.profile.location || "");
        }

        const items: SellerProduct[] = snapProducts.docs.map((d) => {
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

        // Calculate real revenue and monthly metrics from Firestore orders
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let sumTotal = 0;
        let sumMonthly = 0;
        let countMonthly = 0;
        let countPending = 0;
        let totalCount = 0;

        snapOrders.docs.forEach((docSnap) => {
          const o = docSnap.data();
          // Check if order belongs to this store
          const isStoreOrder =
            o.storeId === storeId ||
            (Array.isArray(o.items) && o.items.some((it: any) => it.storeId === storeId));

          if (isStoreOrder) {
            const amount = typeof o.totalAmount === "number" ? o.totalAmount : 0;
            sumTotal += amount;
            totalCount++;

            if (o.status === "pending" || o.status === "en attente") {
              countPending++;
            }

            const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
            if (
              orderDate.getMonth() === currentMonth &&
              orderDate.getFullYear() === currentYear
            ) {
              sumMonthly += amount;
              countMonthly++;
            }
          }
        });

        setTotalRevenue(sumTotal);
        setMonthlyRevenue(sumMonthly);
        setOrdersCount(totalCount);
        setMonthlyOrdersCount(countMonthly);
        setPendingOrdersCount(countPending);

      } catch (e) {
        console.error("Error fetching seller data:", e);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchData();
  }, [user, storeId, successMsg, storeLookupDone]);

  // Auto scroll chat
  useEffect(() => {
    if (isRustOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [rustMessages, isRustOpen]);

  // Send message to Rust AI
  const handleSendRustMessage = async (textToSend?: string) => {
    const text = (textToSend || rustInput).trim();
    if (!text || rustLoading) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setRustMessages((prev) => [...prev, userMsg]);
    setRustInput("");
    setRustLoading(true);

    try {
      const res = await fetch("/api/ai/rust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          storeData: {
            name: storeProfile?.name || "Ma Boutique",
            plan: editPlan,
            totalRevenue,
            monthlyRevenue,
            ordersCount,
            monthlyOrdersCount,
            products: products.map((p) => ({
              name: p.name,
              price: p.price,
              quantity: p.quantity,
              category: p.category,
            })),
          },
          history: rustMessages.slice(-6),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "Je n'ai pas pu analyser la demande. Veuillez réessayer.";

      setRustMessages((prev) => [
        ...prev,
        {
          id: "r_" + Date.now(),
          sender: "rust",
          text: replyText,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Erreur Rust AI:", err);
      setRustMessages((prev) => [
        ...prev,
        {
          id: "r_err_" + Date.now(),
          sender: "rust",
          text: "Désolé, une petite coupure réseau m'empêche de vous répondre. Vérifiez votre connexion et reposez-moi votre question !",
          time: "Erreur",
        },
      ]);
    } finally {
      setRustLoading(false);
    }
  };

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

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    setSavingSettings(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      let logoUrl = storeProfile?.image || "/images/app_icon.png";
      let bannerUrl = storeProfile?.banner || "";

      if (editLogoFile) {
        logoUrl = await uploadToCloudinary(editLogoFile);
      }
      if (editBannerFile) {
        bannerUrl = await uploadToCloudinary(editBannerFile);
      }

      await updateDoc(doc(db, "stores", storeId), {
        storeName: editStoreName.trim(),
        name: editStoreName.trim(),
        description: editStoreDesc.trim(),
        category: editCategory,
        phone: editPhone.trim(),
        location: editLocation.trim(),
        plan: editPlan,
        image: logoUrl,
        profileImageUrl: logoUrl,
        banner: bannerUrl,
        bannerImageUrl: bannerUrl,
        updatedAt: serverTimestamp(),
      });

      setSuccessMsg("Paramètres de la boutique mis à jour avec succès !");
      if (storeProfile) {
        setStoreProfile({
          ...storeProfile,
          name: editStoreName.trim(),
          description: editStoreDesc.trim(),
          location: editLocation.trim(),
          image: logoUrl,
          banner: bannerUrl,
        });
      }
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setErrorMsg("Erreur lors de la mise à jour des paramètres.");
    } finally {
      setSavingSettings(false);
    }
  };

  const FILTER_CATEGORIES = ["Toutes", ...CATEGORIES];

  const normalizeText = (value: string) =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const filteredProducts = products.filter((product) => {
    const searchValue = normalizeText(searchTerm);
    const productName = normalizeText(product.name);
    const productDescription = normalizeText(product.description);
    const productCategory = normalizeText(product.category);
    const selectedCategoryNormalized = normalizeText(selectedCategory);

    const matchesSearch =
      !searchValue ||
      productName.includes(searchValue) ||
      productDescription.includes(searchValue) ||
      productCategory.includes(searchValue);

    const matchesCategory =
      selectedCategoryNormalized === "toutes" ||
      productCategory === selectedCategoryNormalized;

    return matchesSearch && matchesCategory;
  });

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeletingProduct(true);
    try {
      await deleteDoc(doc(db, "products", productToDelete.id));
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setSuccessMsg(`Produit "${productToDelete.name}" supprimé.`);
      setProductToDelete(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setErrorMsg("Impossible de supprimer le produit.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !storeId) return;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
      }

      await addDoc(collection(db, "products"), {
        storeId,
        sellerId: user.uid,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        quantity: Number(quantity),
        category,
        imageUrl: uploadedUrls[0] || "",
        imageUrls: uploadedUrls,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setSuccessMsg("Produit publié avec succès !");
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      console.error("Error creating product:", err);
      setErrorMsg("Erreur lors de la publication du produit.");
    } finally {
      setSaving(false);
    }
  };

  // If no store exists yet
  if (!storeId && storeLookupDone) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 py-12 text-center animate-in fade-in duration-500">
        <div className="w-full rounded-3xl bg-white p-8 md:p-12 shadow-xl border border-neutral-100 flex flex-col items-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-wcom-green/10 text-wcom-green shadow-sm">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Créez votre boutique</h1>
          <p className="mt-3 text-neutral-500 text-sm leading-relaxed max-w-md mb-8">
            Vous n'avez pas encore de boutique active. Configurez-la en quelques étapes pour commencer à vendre sur W-COM.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-wcom-green px-6 py-4 text-sm font-bold text-white shadow-lg shadow-wcom-green/30 transition hover:-translate-y-1 hover:bg-[#007b2f]"
          >
            <Plus className="h-5 w-5" /> Créer ma boutique maintenant
          </button>
        </div>

        {showWizard && (
          <StoreWizard
            userId={user!.uid}
            onComplete={(newStoreId) => {
              setShowWizard(false);
              setStoreId(newStoreId);
            }}
          />
        )}
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-neutral-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="sticky top-4 z-20 mx-auto max-w-7xl w-full rounded-2xl bg-white/90 backdrop-blur-xl shadow-md border border-neutral-200/80 px-4 sm:px-8 py-3.5 animate-in fade-in duration-500">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WComLogo size="sm" />
            <div>
              <h1 className="text-base sm:text-lg font-black text-neutral-900">
                {storeProfile?.name || "Tableau de bord Vendeur"}
              </h1>
              <span className="text-[11px] font-bold text-wcom-green uppercase tracking-wider block">
                Boutique Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Rust AI Assistant button */}
            <button
              onClick={() => setIsRustOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:opacity-95 transition transform active:scale-95"
            >
              <Bot className="h-4 w-4 animate-pulse" />
              <span>Rust IA</span>
            </button>

            <Link
              href="/seller-setup"
              className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Changer d'espace</span>
            </Link>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mt-3 pt-3 border-t border-neutral-100 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition shrink-0 ${
              activeTab === "products"
                ? "bg-wcom-green text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Catalogue ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition shrink-0 ${
              activeTab === "stats"
                ? "bg-wcom-green text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Chiffre d'Affaires</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition shrink-0 ${
              activeTab === "settings"
                ? "bg-wcom-green text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Paramètres Boutique</span>
          </button>
        </div>
      </header>

      {loading || isLoadingProducts ? (
        <div className="mx-auto max-w-7xl w-full py-6 space-y-8 animate-in fade-in duration-500">
          <DashboardStatsSkeleton />
          <DashboardProductsSkeleton />
        </div>
      ) : (
        <div className="mx-auto max-w-7xl w-full py-6 animate-in fade-in duration-500">
          
          {/* Success / Error banners */}
          {successMsg && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-green-50 px-5 py-3.5 text-sm font-semibold text-green-700 shadow-sm border border-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-600 shadow-sm border border-red-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: PRODUCTS CATALOGUE */}
          {activeTab === "products" && (
            <div>
              {/* Stats overview cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Monthly Revenue Card */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">CA Mensuel</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Calendar className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-emerald-600">{formatXOF(monthlyRevenue)}</p>
                  <span className="text-[11px] text-neutral-400">{monthlyOrdersCount} commande(s) ce mois</span>
                </div>

                {/* Total Revenue Card */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">CA Global</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-wcom-orange">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-neutral-900">{formatXOF(totalRevenue)}</p>
                  <span className="text-[11px] text-neutral-400">{ordersCount} commande(s) cumulées</span>
                </div>

                {/* Pending orders */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">En attente</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-amber-600">{pendingOrdersCount}</p>
                  <span className="text-[11px] text-neutral-400">À expédier</span>
                </div>

                {/* Active articles */}
                <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">En catalogue</span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-[#A855F7]">
                      <Package className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-neutral-900">{products.length}</p>
                  <span className="text-[11px] text-neutral-400">Articles en vente</span>
                </div>
              </div>

              {/* Actions row: Search + Add Product */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un produit dans ma boutique..."
                    className="w-full h-11 rounded-xl bg-white border border-neutral-200 pl-10 pr-4 text-sm focus:border-wcom-green outline-none shadow-sm"
                  />
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-wcom-green px-5 text-sm font-bold text-white shadow-md shadow-wcom-green/20 hover:bg-green-700 transition shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter un produit</span>
                </button>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-neutral-200/80">
                  <Package className="mx-auto h-12 w-12 text-neutral-300" />
                  <p className="mt-3 font-bold text-neutral-800">Aucun produit trouvé</p>
                  <p className="mt-1 text-xs text-neutral-400">Ajoutez votre premier produit pour commencer à recevoir des commandes.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-neutral-200/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <Link href={`/seller/product/${p.id}`} className="block flex-1">
                        <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              sizes="260px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-neutral-300">
                              <Package className="h-10 w-10" />
                            </div>
                          )}
                          <span
                            className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase shadow-sm ${
                              p.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {p.status === "active" ? "En ligne" : "Masqué"}
                          </span>
                        </div>

                        <div className="p-4">
                          <p className="line-clamp-1 text-sm font-bold text-neutral-900 group-hover:text-wcom-green transition">
                            {p.name}
                          </p>
                          <span className="text-xs text-neutral-400">{p.category}</span>
                          <div className="mt-2 text-base font-black text-wcom-orange">
                            {formatXOF(p.price)}
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 bg-neutral-50/70">
                        <span className="text-xs font-semibold text-neutral-600">
                          Stock : <strong>{p.quantity}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setProductToDelete(p);
                          }}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAILED STATS & MONTHLY REVENUE */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-200/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-neutral-900">Bilan Financier Mensuel</h2>
                    <p className="text-xs text-neutral-500">Données calculées en temps réel à partir de vos commandes Firestore</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-8">
                  <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5">
                    <span className="text-xs font-bold uppercase text-emerald-800">Chiffre d'Affaires Ce Mois</span>
                    <p className="text-3xl font-black text-emerald-700 mt-2">{formatXOF(monthlyRevenue)}</p>
                    <span className="text-xs text-emerald-600 mt-1 block">Sur {monthlyOrdersCount} commande(s)</span>
                  </div>

                  <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-5">
                    <span className="text-xs font-bold uppercase text-orange-800">Chiffre d'Affaires Global</span>
                    <p className="text-3xl font-black text-wcom-orange mt-2">{formatXOF(totalRevenue)}</p>
                    <span className="text-xs text-orange-600 mt-1 block">{ordersCount} commande(s) au total</span>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-5">
                    <span className="text-xs font-bold uppercase text-neutral-500">Panier Moyen</span>
                    <p className="text-3xl font-black text-neutral-900 mt-2">
                      {formatXOF(ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0)}
                    </p>
                    <span className="text-xs text-neutral-400 mt-1 block">Valeur moyenne par commande</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-wcom-orange" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Besoin d'une analyse détaillée de vos revenus ?</p>
                      <p className="text-xs text-neutral-500">Demandez à Rust IA de vous expliquer vos tendances de vente.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsRustOpen(true);
                      handleSendRustMessage("Fais-moi une analyse détaillée de mes revenus ce mois-ci.");
                    }}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition"
                  >
                    Analyser avec Rust →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STORE SETTINGS */}
          {activeTab === "settings" && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-200/80 max-w-3xl">
              <div className="flex items-center gap-3 border-b border-neutral-100 pb-5 mb-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-700">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-neutral-900">Paramètres de la Boutique</h2>
                  <p className="text-xs text-neutral-500">Personnalisez votre boutique et gérez votre abonnement</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Nom commercial de la boutique *
                  </label>
                  <input
                    type="text"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 focus:bg-white focus:border-wcom-green outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Description de la boutique *
                  </label>
                  <textarea
                    rows={3}
                    value={editStoreDesc}
                    onChange={(e) => setEditStoreDesc(e.target.value)}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-3.5 text-sm text-neutral-800 focus:bg-white focus:border-wcom-green outline-none resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Catégorie principale
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-3 text-sm font-semibold text-neutral-800 focus:bg-white focus:border-wcom-green outline-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Commune / Quartier
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Ex: Cocody Angré"
                      className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-4 text-sm font-semibold text-neutral-800 focus:bg-white focus:border-wcom-green outline-none"
                    />
                  </div>
                </div>

                {/* Plan management */}
                <div className="rounded-2xl bg-neutral-50 p-5 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-wcom-green" />
                      <span className="font-bold text-sm text-neutral-900">Formule d'abonnement W-COM</span>
                    </div>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-black text-green-700">
                      Actif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setEditPlan("monthly")}
                      className={`rounded-xl p-3 text-left border transition ${
                        editPlan === "monthly"
                          ? "border-wcom-green bg-green-50/50 shadow-sm ring-2 ring-wcom-green/20"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-neutral-900">Mensuel</p>
                        {pricing.seller.mensuel === 0 && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Gratuit</span>
                        )}
                      </div>
                      <span className="text-sm font-black text-wcom-green block mt-1">
                        {pricing.seller.mensuel === 0 ? "0 XOF / mois" : `${formatXOF(pricing.seller.mensuel)} / mois`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditPlan("quarterly")}
                      className={`rounded-xl p-3 text-left border transition ${
                        editPlan === "quarterly"
                          ? "border-wcom-green bg-green-50/50 shadow-sm ring-2 ring-wcom-green/20"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-neutral-900">Trimestriel</p>
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">Populaire</span>
                      </div>
                      <span className="text-sm font-black text-wcom-green block mt-1">
                        {formatXOF(pricing.seller.trimestriel)} / 3 mois
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditPlan("annual")}
                      className={`rounded-xl p-3 text-left border transition ${
                        editPlan === "annual"
                          ? "border-wcom-green bg-green-50/50 shadow-sm ring-2 ring-wcom-green/20"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-neutral-900">Annuel</p>
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">VIP Pro</span>
                      </div>
                      <span className="text-sm font-black text-wcom-green block mt-1">
                        {formatXOF(pricing.seller.annuel)} / an
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className={`relative overflow-hidden flex items-center gap-2 rounded-xl bg-wcom-green px-6 py-3 text-sm font-bold text-white shadow-md shadow-wcom-green/20 hover:bg-green-700 transition disabled:opacity-75 ${
                      savingSettings
                        ? "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent"
                        : ""
                    }`}
                  >
                    {savingSettings && <LoadingCircle className="text-white" />}
                    <span>{savingSettings ? "Enregistrement en cours..." : "Enregistrer les modifications"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

      {/* RUST AI CHATBOT DRAWER / WIDGET */}
      {isRustOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsRustOpen(false)}
        >
          <div
            className="w-full sm:max-w-md h-[85vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-neutral-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm">Rust IA</h3>
                    <span className="rounded-full bg-orange-500/30 text-orange-400 border border-orange-500/40 px-2 py-0.2 text-[10px] font-bold">
                      Google Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300">Conseiller business de {storeProfile?.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsRustOpen(false)}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/70">
              {rustMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "rust" && (
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500 text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                      m.sender === "user"
                        ? "bg-wcom-green text-white font-medium"
                        : "bg-white text-neutral-800 border border-neutral-200/80 font-normal"
                    }`}
                  >
                    {m.text}
                    <span className={`block text-[10px] mt-1 text-right ${m.sender === "user" ? "text-white/70" : "text-neutral-400"}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}

              {rustLoading && (
                <div className="flex gap-2.5 items-center text-neutral-400 text-xs py-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500 text-white shrink-0 shadow-sm animate-pulse">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-2xl border border-neutral-200">
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Pills */}
            <div className="p-2.5 border-t border-neutral-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                "💰 Mon CA ce mois-ci ?",
                "📦 Produits à restocker ?",
                "🚀 Conseils pour vendre plus",
                "📊 Bilan global",
              ].map((pill) => (
                <button
                  key={pill}
                  onClick={() => handleSendRustMessage(pill)}
                  className="rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-1 text-[11px] font-semibold text-neutral-700 whitespace-nowrap transition"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendRustMessage();
              }}
              className="p-3 border-t border-neutral-200 bg-white flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={rustInput}
                onChange={(e) => setRustInput(e.target.value)}
                placeholder="Posez une question à Rust..."
                className="flex-1 h-11 rounded-2xl bg-neutral-100 px-4 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/30 border border-transparent focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!rustInput.trim() || rustLoading}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-40 shadow-md shadow-orange-500/20 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Rust Trigger Button */}
      {!isRustOpen && (
        <button
          onClick={() => setIsRustOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-neutral-900" />
          </div>
          <span className="text-xs font-black">Rust IA</span>
        </button>
      )}

      {/* Delete product confirmation modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-neutral-900">Supprimer cet article ?</h3>
            <p className="text-xs text-neutral-500">
              Êtes-vous sûr de vouloir supprimer <strong>{productToDelete.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeletingProduct}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingProduct ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 py-8">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <h3 className="text-lg font-black text-neutral-900">Ajouter un produit</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Nom du produit *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Robe Wax Élégance"
                  className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-3.5 text-sm focus:bg-white focus:border-wcom-green outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description détaillée du produit..."
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-sm focus:bg-white focus:border-wcom-green outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Prix (XOF) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 15000"
                    className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-3 text-sm focus:bg-white focus:border-wcom-green outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Quantité en stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-3 text-sm focus:bg-white focus:border-wcom-green outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 rounded-xl bg-neutral-50 border border-neutral-200 px-3 text-sm font-semibold text-neutral-800 focus:bg-white focus:border-wcom-green outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Photos du produit
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-6 text-sm font-bold text-neutral-600 hover:border-wcom-green hover:bg-neutral-50 transition"
                >
                  <Upload className="h-5 w-5 text-neutral-400" />
                  <span>Choisir des photos</span>
                </button>

                {imagePreviews.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-neutral-200">
                        <img src={src} alt="Aperçu" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-wcom-green py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? "Publication..." : "Publier le produit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-50">
          <LoadingSpinner />
        </div>
      }
    >
      <SellerDashboardContent />
    </Suspense>
  );
}
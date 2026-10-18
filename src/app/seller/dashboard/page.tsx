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
  Star,
  MessageSquare,
  ExternalLink,
  Camera,
  BarChart3,
  Eye,
  Info,
  Check,
} from "lucide-react";
import { WComLogo } from "@/components/brand/wcom-logo";
import { LoadingSpinner, LoadingCircle } from "@/components/ui/loading-spinner";
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

export interface ProductReview {
  id: string;
  storeId?: string;
  productId?: string;
  productName?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ProductSalesStat {
  productId: string;
  salesQty: number;
  revenue: number;
  orderCount: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "repos";
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
  
  const [activeTab, setActiveTab] = useState<"products" | "stats" | "reviews" | "settings">("products");
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

  // Reviews and Per-Product Sales analytics
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [productSalesMap, setProductSalesMap] = useState<Map<string, ProductSalesStat>>(new Map());
  const [statsSearchTerm, setStatsSearchTerm] = useState("");
  const [reviewFilterRating, setReviewFilterRating] = useState<number | "all">("all");

  // Settings form
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreDesc, setEditStoreDesc] = useState("");
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPlan, setEditPlan] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
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

  // Repos AI state
  const [isReposOpen, setIsReposOpen] = useState(false);
  const [reposMessages, setReposMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      sender: "repos",
      text: "Bonjour ! Je suis Repos, votre conseiller IA W-COM. Je suis connecté aux données de vos ventes, de vos stocks et de vos revenus. Comment puis-je vous aider aujourd'hui ?",
      time: "Maintenant",
    },
  ]);
  const [reposInput, setReposInput] = useState("");
  const [reposLoading, setReposLoading] = useState(false);
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
              // Create store adhering strictly to Firestore security rules:
              // - ownerId must match user.uid
              // - isActive must be omitted or false
              // - currentPlan must not be included
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

              // Also update user profile with storeId and seller role
              try {
                await updateDoc(doc(db, "users", user.uid), {
                  storeId: storeRef.id,
                  role: "seller",
                  updatedAt: serverTimestamp(),
                });
              } catch (uErr) {
                console.warn("Could not update user doc with storeId:", uErr);
              }

              sessionStorage.removeItem("wcom_pending_store_setup");
              setStoreId(storeRef.id);
              setSuccessMsg("Félicitations ! Votre abonnement a été validé et votre boutique est maintenant active.");
              router.replace("/seller/dashboard");
            } catch (err: any) {
              console.error("Error creating validated store:", err);
              if (
                err?.code === "permission-denied" ||
                err?.message?.includes("Missing or insufficient permissions")
              ) {
                setErrorMsg("Erreur de permissions Firebase : Les règles Firestore doivent autoriser la collection 'stores'.");
              } else {
                setErrorMsg("Erreur lors de la finalisation de la boutique.");
              }
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
        const [profileLookup, snapProducts, snapOrders, snapReviews] = await Promise.all([
          fetchStoreProfile(storeId),
          getDocs(
            query(
              collection(db, "products"),
              where("storeId", "==", storeId),
              orderBy("createdAt", "desc")
            )
          ),
          getDocs(collection(db, "orders")),
          getDocs(
            query(
              collection(db, "reviews"),
              where("storeId", "==", storeId)
            )
          ).catch((e) => {
            console.warn("Reviews fetch error:", e);
            return { docs: [] } as any;
          }),
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

        // Product ID lookup map for sales calculation
        const productIdsSet = new Set(items.map((it) => it.id));
        const salesMap = new Map<string, ProductSalesStat>();

        // Initialize for all store products so every product has stats
        items.forEach((p) => {
          salesMap.set(p.id, {
            productId: p.id,
            salesQty: 0,
            revenue: 0,
            orderCount: 0,
          });
        });

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
            (Array.isArray(o.items) &&
              o.items.some((it: any) => it.storeId === storeId || productIdsSet.has(it.productId || it.id)));

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

          // Per-product specific sales computation
          if (Array.isArray(o.items)) {
            o.items.forEach((it: any) => {
              const pid = it.productId || it.id;
              if (pid && (productIdsSet.has(pid) || it.storeId === storeId)) {
                const qty = typeof it.quantity === "number" ? it.quantity : 1;
                const price =
                  typeof it.price === "number"
                    ? it.price
                    : items.find((x) => x.id === pid)?.price || 0;
                const prev = salesMap.get(pid) || {
                  productId: pid,
                  salesQty: 0,
                  revenue: 0,
                  orderCount: 0,
                };
                prev.salesQty += qty;
                prev.revenue += qty * price;
                prev.orderCount += 1;
                salesMap.set(pid, prev);
              }
            });
          }
        });

        setProductSalesMap(salesMap);
        setTotalRevenue(sumTotal);
        setMonthlyRevenue(sumMonthly);
        setOrdersCount(totalCount);
        setMonthlyOrdersCount(countMonthly);
        setPendingOrdersCount(countPending);

        // Process reviews
        const fetchedReviews: ProductReview[] = (snapReviews.docs || []).map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            storeId: data.storeId || storeId,
            productId: data.productId || "",
            productName:
              data.productName ||
              items.find((x) => x.id === data.productId)?.name ||
              "Produit de la boutique",
            userId: data.userId || "",
            userName: data.userName || data.reviewerName || "Client W-COM",
            userAvatar: data.userAvatar || data.photoURL || "",
            rating: typeof data.rating === "number" ? data.rating : 5,
            comment: data.comment || data.review || "",
            createdAt:
              data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          };
        });
        setReviews(fetchedReviews);

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
    if (isReposOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [reposMessages, isReposOpen]);

  // Send message to Repos AI
  const handleSendReposMessage = async (textToSend?: string) => {
    const text = (textToSend || reposInput).trim();
    if (!text || reposLoading) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setReposMessages((prev) => [...prev, userMsg]);
    setReposInput("");
    setReposLoading(true);

    try {
      const res = await fetch("/api/ai/repos", {
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
          history: reposMessages.slice(-6),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "Je n'ai pas pu analyser la demande. Veuillez réessayer.";

      setReposMessages((prev) => [
        ...prev,
        {
          id: "r_" + Date.now(),
          sender: "repos",
          text: replyText,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("Erreur Repos AI:", err);
      setReposMessages((prev) => [
        ...prev,
        {
          id: "r_err_" + Date.now(),
          sender: "repos",
          text: "Désolé, une petite coupure réseau m'empêche de vous répondre. Vérifiez votre connexion et reposez-moi votre question !",
          time: "Erreur",
        },
      ]);
    } finally {
      setReposLoading(false);
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

  // Handle Add Test Review (Firestore connected)
  const handleAddTestReview = async () => {
    if (!storeId || !user) return;
    try {
      const prod = products[0];
      const testNames = ["Awa Traoré", "Kouamé Jean", "Fatou Cissé", "Yao Marc", "Aïcha Diallo"];
      const testComments = [
        "Produit d'excellente qualité, conforme à la description et livré très rapidement !",
        "Super content de mon achat ! Vendeur très sérieux, je recommande vivement cette boutique.",
        "Emballage soigné et article au top. Je commanderai à nouveau sans hésiter !",
        "Très bonne boutique W-COM, service client impeccable et réactif.",
        "Article reçu en parfait état, exactement comme sur les photos. Bravo au vendeur !",
      ];
      const randomName = testNames[Math.floor(Math.random() * testNames.length)];
      const randomComment = testComments[Math.floor(Math.random() * testComments.length)];
      const randomRating = 5;

      const docRef = await addDoc(collection(db, "reviews"), {
        storeId,
        productId: prod?.id || "",
        productName: prod?.name || "Article boutique",
        userId: user.uid,
        userName: randomName,
        rating: randomRating,
        comment: randomComment,
        createdAt: serverTimestamp(),
      });

      const newReview: ProductReview = {
        id: docRef.id,
        storeId,
        productId: prod?.id || "",
        productName: prod?.name || "Article boutique",
        userId: user.uid,
        userName: randomName,
        rating: randomRating,
        comment: randomComment,
        createdAt: new Date(),
      };

      setReviews((prev) => [newReview, ...prev]);
      setSuccessMsg("Avis client ajouté avec succès sur Firestore !");
    } catch (err) {
      console.error("Error creating review:", err);
      setErrorMsg("Impossible d'ajouter l'avis test.");
    }
  };

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
            {/* Quick Repos AI Assistant button */}
            <button
              onClick={() => setIsReposOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:opacity-95 transition transform active:scale-95"
            >
              <Bot className="h-4 w-4 animate-pulse" />
              <span>Repos IA</span>
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
            <span>Statistiques & Ventes</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition shrink-0 ${
              activeTab === "reviews"
                ? "bg-wcom-green text-white shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Star className="h-3.5 w-3.5" />
            <span>Avis Clients ({reviews.length})</span>
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

          {/* STORE HERO HEADER CARD (BANNER & PROFILE IMAGE) */}
          <div className="relative overflow-hidden rounded-3xl bg-white border border-neutral-200/80 shadow-sm mb-8">
            {/* Banner image or styled fallback gradient */}
            <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-emerald-800 via-teal-900 to-neutral-900 overflow-hidden">
              {storeProfile?.banner ? (
                <Image
                  src={storeProfile.banner}
                  alt={storeProfile.name || "Bannière boutique"}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Quick banner edit shortcut */}
              <button
                onClick={() => setActiveTab("settings")}
                className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm border border-white/20"
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Changer bannière / photo</span>
              </button>
            </div>

            {/* Store Info & Profile Image */}
            <div className="px-6 pb-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
                <div className="flex items-end gap-4">
                  {/* Profile Image (Avatar) */}
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl sm:rounded-3xl border-4 border-white bg-white shadow-xl overflow-hidden shrink-0">
                    <Image
                      src={storeProfile?.image || "/images/app_icon.png"}
                      alt={storeProfile?.name || "Logo boutique"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Store Title & Badges */}
                  <div className="pt-2 sm:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900">
                        {storeProfile?.name || "Ma Boutique W-COM"}
                      </h1>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Boutique Active
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-neutral-400" />
                        {editCategory || "Commerce Général"}
                      </span>
                      {storeProfile?.location && (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                          {storeProfile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {reviews.length > 0
                          ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                          : "5.0"}
                        <span className="text-neutral-400 font-normal">({reviews.length} avis)</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                  <Link
                    href={`/store/${storeId}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition shadow-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Voir ma boutique en ligne</span>
                  </Link>

                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-wcom-green px-4 py-2 text-xs font-bold text-white shadow-md shadow-wcom-green/20 hover:bg-green-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un produit</span>
                  </button>
                </div>
              </div>

              {/* Store Description */}
              {storeProfile?.description && (
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 line-clamp-2 max-w-3xl">
                  {storeProfile.description}
                </p>
              )}
            </div>
          </div>

          {/* TAB 1: PRODUCTS CATALOGUE */}
          {activeTab === "products" && (
            <div>
              {/* Section Guide */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 border border-emerald-500/20">
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-neutral-900">Catalogue des Produits</h2>
                    <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                      Gérez l'ensemble des articles en vente sur votre boutique W-COM. Vous pouvez publier de nouveaux produits, modifier vos prix, surveiller les stocks restants en direct et vérifier le nombre total de ventes réalisées sur chaque article.
                    </p>
                  </div>
                </div>
              </div>

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
                  {filteredProducts.map((p) => {
                    const salesStat = productSalesMap.get(p.id);
                    const soldQty = salesStat?.salesQty || 0;
                    return (
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
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="text-base font-black text-wcom-orange">
                                {formatXOF(p.price)}
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black text-wcom-orange">
                                🔥 {soldQty} vendu{soldQty > 1 ? "s" : ""}
                              </span>
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAILED STATS & PER-PRODUCT SALES */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Section Guide */}
              <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-5 border border-orange-500/20">
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-wcom-orange text-white shadow-sm">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-neutral-900">Statistiques & Ventes Détaillées</h2>
                    <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                      Analysez les flux financiers et l'attractivité de vos articles. Retrouvez vos chiffres d'affaires réels calculés en direct depuis vos commandes, ainsi qu'un tableau interactif mesurant pour chaque article spécifique sa <strong>quantité exacte vendue</strong> et son chiffre d'affaires généré.
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Metrics Cards */}
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-200/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">Bilan Financier Global & Mensuel</h3>
                    <p className="text-xs text-neutral-500">Données calculées en temps réel à partir de vos commandes Firestore</p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5">
                    <span className="text-xs font-bold uppercase text-emerald-800">CA Ce Mois</span>
                    <p className="text-3xl font-black text-emerald-700 mt-2">{formatXOF(monthlyRevenue)}</p>
                    <span className="text-xs text-emerald-600 mt-1 block">{monthlyOrdersCount} commande(s)</span>
                  </div>

                  <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-5">
                    <span className="text-xs font-bold uppercase text-orange-800">CA Cumulé</span>
                    <p className="text-3xl font-black text-wcom-orange mt-2">{formatXOF(totalRevenue)}</p>
                    <span className="text-xs text-orange-600 mt-1 block">{ordersCount} commande(s) totales</span>
                  </div>

                  <div className="rounded-2xl bg-purple-50/60 border border-purple-100 p-5">
                    <span className="text-xs font-bold uppercase text-purple-800">Total Unités Vendues</span>
                    <p className="text-3xl font-black text-purple-700 mt-2">
                      {Array.from(productSalesMap.values()).reduce((acc, s) => acc + s.salesQty, 0)}
                    </p>
                    <span className="text-xs text-purple-600 mt-1 block">Articles achetés</span>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-5">
                    <span className="text-xs font-bold uppercase text-neutral-500">Panier Moyen</span>
                    <p className="text-3xl font-black text-neutral-900 mt-2">
                      {formatXOF(ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0)}
                    </p>
                    <span className="text-xs text-neutral-400 mt-1 block">Par commande</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-6 w-6 text-wcom-orange shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Besoin d'une analyse stratégique de vos ventes ?</p>
                      <p className="text-xs text-neutral-500">Demandez à Repos IA de vous expliquer vos tendances et opportunités.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsReposOpen(true);
                      handleSendReposMessage("Fais-moi une analyse détaillée de mes ventes et de mes articles les plus rentables.");
                    }}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition shrink-0"
                  >
                    Analyser avec Repos →
                  </button>
                </div>
              </div>

              {/* PER-PRODUCT SPECIFIC SALES TABLE */}
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-neutral-900">Performances & Quantités Vendues par Produit</h3>
                    <p className="text-xs text-neutral-500">Détail précis des volumes écoulés et du revenu généré pour chaque article</p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="search"
                      value={statsSearchTerm}
                      onChange={(e) => setStatsSearchTerm(e.target.value)}
                      placeholder="Filtrer un produit..."
                      className="w-full h-10 rounded-xl bg-neutral-50 border border-neutral-200 pl-9 pr-4 text-xs font-medium focus:bg-white focus:border-wcom-green outline-none"
                    />
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 text-xs">
                    Aucun produit dans le catalogue pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                          <th className="pb-3 pl-2">Article</th>
                          <th className="pb-3">Catégorie</th>
                          <th className="pb-3 text-right">Prix Unitaire</th>
                          <th className="pb-3 text-center">Quantité Vendue</th>
                          <th className="pb-3 text-right">CA Généré</th>
                          <th className="pb-3 text-center">Stock Actuel</th>
                          <th className="pb-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-xs">
                        {products
                          .filter(
                            (p) =>
                              !statsSearchTerm ||
                              p.name.toLowerCase().includes(statsSearchTerm.toLowerCase()) ||
                              p.category.toLowerCase().includes(statsSearchTerm.toLowerCase())
                          )
                          .map((p) => {
                            const stat = productSalesMap.get(p.id) || { salesQty: 0, revenue: 0, orderCount: 0 };
                            return (
                              <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                                <td className="py-3.5 pl-2 flex items-center gap-3">
                                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                                    <Image
                                      src={p.imageUrl || "/images/app_icon.png"}
                                      alt={p.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <Link
                                      href={`/seller/product/${p.id}`}
                                      className="font-bold text-neutral-900 hover:text-wcom-green transition line-clamp-1"
                                    >
                                      {p.name}
                                    </Link>
                                    <span className="text-[10px] text-neutral-400">{stat.orderCount} commande(s)</span>
                                  </div>
                                </td>
                                <td className="py-3.5 text-neutral-600">{p.category}</td>
                                <td className="py-3.5 text-right font-black text-neutral-900">{formatXOF(p.price)}</td>
                                <td className="py-3.5 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-black ${
                                      stat.salesQty > 0
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-neutral-100 text-neutral-500"
                                    }`}
                                  >
                                    {stat.salesQty > 0
                                      ? `🔥 ${stat.salesQty} unité${stat.salesQty > 1 ? "s" : ""}`
                                      : "0 vendu"}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right font-black text-emerald-600">
                                  {formatXOF(stat.revenue)}
                                </td>
                                <td className="py-3.5 text-center">
                                  <span
                                    className={`font-bold ${
                                      p.quantity === 0
                                        ? "text-red-500"
                                        : p.quantity < 5
                                        ? "text-amber-600"
                                        : "text-neutral-700"
                                    }`}
                                  >
                                    {p.quantity} en stock
                                  </span>
                                </td>
                                <td className="py-3.5 text-center">
                                  {stat.salesQty >= 5 ? (
                                    <span className="rounded-full bg-orange-100 text-orange-800 px-2 py-0.5 text-[10px] font-black uppercase">
                                      Top Vente
                                    </span>
                                  ) : stat.salesQty > 0 ? (
                                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase">
                                      Vendu
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-neutral-100 text-neutral-500 px-2 py-0.5 text-[10px] font-semibold">
                                      En attente
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS & CUSTOMER FEEDBACK */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Section Guide */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 border border-amber-500/20">
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-neutral-900">Avis & Retours Clients</h2>
                    <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                      Consultez l'ensemble des notes et commentaires laissés par vos acheteurs sur vos produits. Ces retours d'expérience sont directement liés à Firestore et vous permettent de mesurer la satisfaction de votre clientèle.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating Overview Card */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Average rating box */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200/80 flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Note Moyenne</span>
                  <div className="text-5xl font-black text-neutral-900">
                    {reviews.length > 0
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                      : "5.0"}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="mt-2 text-xs text-neutral-400">
                    Sur {reviews.length} avis client{reviews.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Star distribution */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-200/80 md:col-span-2 flex flex-col justify-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Répartition des Évaluations</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                      const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : stars === 5 ? 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-bold text-neutral-700 flex items-center gap-1">
                            {stars} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-neutral-400 font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filter Pills and Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setReviewFilterRating("all")}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      reviewFilterRating === "all"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    Tous ({reviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
                    return (
                      <button
                        key={stars}
                        onClick={() => setReviewFilterRating(stars)}
                        className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          reviewFilterRating === stars
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        <span>{stars}</span>
                        <Star className="h-3 w-3 fill-current" />
                        <span>({count})</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleAddTestReview}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ajouter un avis test</span>
                </button>
              </div>

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-neutral-200/80">
                  <MessageSquare className="mx-auto h-12 w-12 text-neutral-300" />
                  <p className="mt-3 font-bold text-neutral-800">Aucun avis client pour l'instant</p>
                  <p className="mt-1 text-xs text-neutral-400 max-w-sm mx-auto">
                    Dès qu'un client passera commande ou publiera un retour sur vos articles, ses notes et commentaires apparaîtront ici.
                  </p>
                  <button
                    onClick={handleAddTestReview}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Créer un avis de test</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reviews
                    .filter((r) => reviewFilterRating === "all" || Math.round(r.rating) === reviewFilterRating)
                    .map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-200/80 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-100 text-neutral-700 font-bold text-xs">
                                {rev.userName ? rev.userName[0].toUpperCase() : "C"}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-neutral-900">{rev.userName}</span>
                                  <span className="rounded-full bg-emerald-50 text-emerald-700 px-1.5 py-0.2 text-[9px] font-bold">
                                    Vérifié
                                  </span>
                                </div>
                                <span className="text-[10px] text-neutral-400">
                                  {rev.createdAt.toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < Math.round(rev.rating) ? "fill-amber-400" : "text-neutral-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.productName && (
                            <div className="mb-2">
                              <span className="inline-block rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                                Article : {rev.productName}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-neutral-700 leading-relaxed italic">
                            "{rev.comment}"
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORE SETTINGS & VISUAL IDENTITY */}
          {activeTab === "settings" && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-neutral-200/80 max-w-3xl">
              {/* Section Guide */}
              <div className="mb-8 rounded-2xl bg-gradient-to-r from-neutral-800/10 via-neutral-800/5 to-transparent p-5 border border-neutral-300">
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-900 text-white shadow-sm">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-neutral-900">Paramètres & Identité Visuelle</h2>
                    <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed">
                      Personnalisez la vitrine de votre boutique : téléversez votre <strong>photo de profil / logo</strong> et votre <strong>bannière de couverture</strong>, modifiez vos informations de contact, votre localisation et votre formule d'abonnement W-COM.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Visual Identity Section (Banner & Logo) */}
                <div className="rounded-2xl bg-neutral-50 p-5 border border-neutral-200/80 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Identité Visuelle de la Boutique</h3>

                  {/* Banner uploader */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1.5">
                      Bannière de couverture (en-tête de votre boutique)
                    </label>
                    <div className="relative h-32 w-full rounded-2xl border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center hover:border-wcom-green transition group">
                      {bannerPreview || storeProfile?.banner ? (
                        <>
                          <Image
                            src={bannerPreview || storeProfile?.banner || ""}
                            alt="Bannière prévisualisée"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-2">
                            <Camera className="h-4 w-4" />
                            <span>Changer la bannière</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-neutral-400">
                          <Camera className="h-6 w-6" />
                          <span className="text-xs font-semibold">Cliquez pour choisir une image de bannière</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditBannerFile(file);
                            setBannerPreview(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Logo uploader */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1.5">
                      Photo de profil / Logo commercial
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-neutral-300 bg-white overflow-hidden flex items-center justify-center shrink-0">
                        <Image
                          src={logoPreview || storeProfile?.image || "/images/app_icon.png"}
                          alt="Logo prévisualisé"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition shadow-sm">
                        <Upload className="h-4 w-4" />
                        <span>Choisir un logo ou photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEditLogoFile(file);
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

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
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-700">Flexible</span>
                      </div>
                      <span className="text-sm font-black text-wcom-green block mt-1">
                        {formatXOF(pricing.seller.mensuel)} / mois
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

      {/* REPOS AI CHATBOT DRAWER / WIDGET */}
      {isReposOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsReposOpen(false)}
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
                    <h3 className="font-black text-sm">Repos IA</h3>
                    <span className="rounded-full bg-orange-500/30 text-orange-400 border border-orange-500/40 px-2 py-0.2 text-[10px] font-bold">
                      Google Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300">Conseiller business de {storeProfile?.name}</p>
                </div>
              </div>

              <button
                onClick={() => setIsReposOpen(false)}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-neutral-50/70">
              {reposMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.sender === "repos" && (
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

              {reposLoading && (
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
                  onClick={() => handleSendReposMessage(pill)}
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
                handleSendReposMessage();
              }}
              className="p-3 border-t border-neutral-200 bg-white flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={reposInput}
                onChange={(e) => setReposInput(e.target.value)}
                placeholder="Posez une question à Repos..."
                className="flex-1 h-11 rounded-2xl bg-neutral-100 px-4 text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/30 border border-transparent focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!reposInput.trim() || reposLoading}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-40 shadow-md shadow-orange-500/20 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Repos Trigger Button */}
      {!isReposOpen && (
        <button
          onClick={() => setIsReposOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-neutral-900" />
          </div>
          <span className="text-xs font-black">Repos IA</span>
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
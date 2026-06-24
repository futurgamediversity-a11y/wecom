/**
 * Mock data placeholders — replaces Firestore queries in the Flutter app.
 * Real Firebase wiring lives in a later phase.
 */

export type Category = {
  id: string;
  name: string;
  icon: string; // lucide-react icon name
  accent?: "orange" | "green";
};

export type Product = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: "XOF";
  images?: string[]; // urls
  category?: string;
  storeId?: string;
  storeName?: string;
  storePlan?: "free" | "premium" | "enterprise";
  rating?: number;
  reviewCount?: number;
  stock?: number;
  variants?: { name: string; options: string[] }[];
  flashSale?: boolean;
};

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

export type OrderStatus =
  | "en attente"
  | "confirmée"
  | "en livraison"
  | "livrée"
  | "annulée";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  items: { name: string; quantity: number; price: number; imageUrl: string }[];
  address: string;
  paymentMethod: string;
};

export const communes = [
  "Cocody",
  "Marcory",
  "Yopougon",
  "Plateau",
  "Treichville",
  "Bingerville",
] as const;

export const categories: Category[] = [
  { id: "flash", name: "Ventes Flash", icon: "Zap", accent: "orange" },
  { id: "all", name: "Tout", icon: "LayoutGrid", accent: "green" },
  { id: "fashion", name: "Mode", icon: "Shirt" },
  { id: "electronics", name: "Électronique", icon: "Smartphone" },
  { id: "beauty", name: "Beauté", icon: "Sparkles" },
  { id: "home", name: "Maison", icon: "Sofa" },
];

const placeholder = (seed: string, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const products: Product[] = [
  {
    id: "p-001",
    name: "Sneakers Urban Pro",
    description:
      "Baskets légères en mesh respirant, semelle EVA confort. Idéales pour le quotidien à Abidjan.",
    price: 35000,
    currency: "XOF",
    images: [placeholder("sneakers-1"), placeholder("sneakers-2"), placeholder("sneakers-3")],
    category: "Mode",
    storeId: "store-akwaba",
    storeName: "Akwaba Sport",
    storePlan: "premium",
    rating: 4.6,
    reviewCount: 128,
    stock: 24,
    variants: [
      { name: "Taille", options: ["40", "41", "42", "43", "44"] },
      { name: "Couleur", options: ["Noir", "Blanc", "Vert"] },
    ],
    flashSale: true,
  },
  {
    id: "p-002",
    name: "AirPods Pro (2e gén.)",
    description: "Écouteurs sans fil à réduction de bruit active.",
    price: 145000,
    currency: "XOF",
    images: [placeholder("airpods-1"), placeholder("airpods-2")],
    category: "Électronique",
    storeId: "store-tech-abj",
    storeName: "Tech ABJ",
    storePlan: "enterprise",
    rating: 4.8,
    reviewCount: 412,
    stock: 8,
  },
  {
    id: "p-003",
    name: "Robe en Wax — Modèle Sirine",
    description: "Robe ample en wax 100 % coton, finition soignée.",
    price: 22500,
    currency: "XOF",
    images: [placeholder("robe-wax-1"), placeholder("robe-wax-2")],
    category: "Mode",
    storeId: "store-fatou",
    storeName: "Atelier Fatou",
    storePlan: "free",
    rating: 4.9,
    reviewCount: 64,
    stock: 12,
    variants: [{ name: "Taille", options: ["S", "M", "L", "XL"] }],
  },
  {
    id: "p-004",
    name: "Montre connectée Series 9",
    description: "Suivi cardio, GPS, étanche 50m, autonomie 18h.",
    price: 220000,
    currency: "XOF",
    images: [placeholder("watch-1"), placeholder("watch-2")],
    category: "Électronique",
    storeId: "store-tech-abj",
    storeName: "Tech ABJ",
    storePlan: "enterprise",
    rating: 4.7,
    reviewCount: 88,
    stock: 5,
  },
  {
    id: "p-005",
    name: "Sérum éclaircissant naturel",
    description: "Sérum à base de vitamine C et beurre de karité.",
    price: 9500,
    currency: "XOF",
    images: [placeholder("beauty-1")],
    category: "Beauté",
    storeId: "store-cocody-beauty",
    storeName: "Cocody Beauty",
    rating: 4.4,
    reviewCount: 39,
    stock: 60,
    flashSale: true,
  },
  {
    id: "p-006",
    name: "Canapé 3 places — Tissu lin",
    description: "Canapé moderne, structure bois massif, coussins déhoussables.",
    price: 385000,
    currency: "XOF",
    images: [placeholder("sofa-1"), placeholder("sofa-2")],
    category: "Maison",
    storeId: "store-deco",
    storeName: "Maison Déco CI",
    storePlan: "premium",
    rating: 4.5,
    reviewCount: 21,
    stock: 3,
  },
  {
    id: "p-007",
    name: "Casque audio Bass+",
    description: "Casque circum-aural Bluetooth 5.3.",
    price: 38000,
    currency: "XOF",
    images: [placeholder("headphones-1")],
    category: "Électronique",
    storeId: "store-tech-abj",
    storeName: "Tech ABJ",
    storePlan: "enterprise",
    rating: 4.3,
    reviewCount: 57,
    stock: 18,
  },
  {
    id: "p-008",
    name: "T-shirt graphique « ABJ »",
    description: "Coton bio, sérigraphie haut de gamme.",
    price: 8500,
    currency: "XOF",
    images: [placeholder("tshirt-1")],
    category: "Mode",
    storeId: "store-akwaba",
    storeName: "Akwaba Sport",
    storePlan: "premium",
    rating: 4.2,
    reviewCount: 17,
    stock: 40,
  },
];

export const recentSearches = ["Sneakers", "AirPods", "Robe Wax", "Montres"];

export const mockOrders: Order[] = [
  {
    id: "ord-2026-001",
    createdAt: "2026-05-22T14:25:00Z",
    status: "en livraison",
    total: 35000,
    address: "Cocody, Riviera Palmeraie, Abidjan",
    paymentMethod: "Wave",
    items: [
      {
        name: "Sneakers Urban Pro",
        quantity: 1,
        price: 35000,
        imageUrl: placeholder("sneakers-1", 200, 200),
      },
    ],
  },
  {
    id: "ord-2026-002",
    createdAt: "2026-05-10T09:10:00Z",
    status: "livrée",
    total: 32000,
    address: "Marcory, Zone 4, Abidjan",
    paymentMethod: "Orange Money",
    items: [
      {
        name: "Robe en Wax — Modèle Sirine",
        quantity: 1,
        price: 22500,
        imageUrl: placeholder("robe-wax-1", 200, 200),
      },
      {
        name: "Sérum éclaircissant naturel",
        quantity: 1,
        price: 9500,
        imageUrl: placeholder("beauty-1", 200, 200),
      },
    ],
  },
];

export const paymentMethods = [
  { id: "wave", name: "Wave", logo: "/images/payments/wave.png" },
  { id: "om", name: "Orange Money", logo: "/images/payments/om.png" },
  { id: "momo", name: "MTN Mobile Money", logo: "/images/payments/momo.png" },
  { id: "moov", name: "Moov Money", logo: "/images/payments/moov.png" },
  { id: "card", name: "Carte bancaire", logo: "/images/payments/card.png" },
];

export function productById(id: string) {
  return products.find((p) => p.id === id);
}

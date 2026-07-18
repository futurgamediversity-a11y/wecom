export type Category = {
  id: string;
  name: string;
  icon: string;
  accent?: "orange" | "green";
};

export type Product = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: "XOF";
  images?: string[];
  category?: string;
  storeId?: string;
  storeName?: string;
  storePlan?: "free" | "premium" | "enterprise";
  rating?: number;
  reviewCount?: number;
  stock?: number;
  variants?: { name: string; options: string[] }[];
  flashSale?: boolean;
  status?: string;
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

import { type Product } from "@/lib/types";

/**
 * Firestore collections and document shapes as this database actually
 * stores them.
 *
 * firestore.rules is the authority here: the Flutter app writes these
 * documents and the web client mostly reads them, so the field names below
 * are taken from the rules and from live documents rather than from what a
 * page happened to expect. Keeping the mapping in one module means a field
 * rename is one edit instead of a hunt across six pages.
 *
 * Everything is coerced on the way in. Firestore hands back whatever was
 * written, and a non-string reaching JSX throws React error #31 — which is
 * exactly what stores/{id}.location, a GeoPoint, did to the store page.
 */
export const COLLECTIONS = {
  products: "products",
  stores: "stores",
  users: "users",
  cart: "cart",
  orders: "orders",
  favorites: "favorites",
} as const;

/* ------------------------------------------------------------------ */
/* Coercion                                                            */
/* ------------------------------------------------------------------ */

export function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // Firestore int64 arrives as a string through some transports.
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function asTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asText).filter((v): v is string => Boolean(v));
}

/** Accepts a Firestore Timestamp, a Date, or epoch millis. */
export function asDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === "object" &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  const millis = asNumber(value);
  return millis === undefined ? undefined : new Date(millis);
}

/* ------------------------------------------------------------------ */
/* products/{productId}                                                */
/* ------------------------------------------------------------------ */

/**
 * Keys per firestore.rules and live documents: name, description, price,
 * quantity, category, storeId, imageUrl, imageUrls, status, averageRating,
 * reviewCount, createdAt, lastUpdated, and the backend-only featured*
 * fields.
 *
 * Ratings come from averageRating/reviewCount. Every page previously
 * hardcoded both to 0, so real ratings never reached the UI. `quantity` is
 * the stock figure; there is no `stock` field.
 */
export function toProduct(id: string, data: Record<string, unknown>): Product {
  const gallery = asTextList(data.imageUrls);
  const cover = asText(data.imageUrl);
  // `data.imageUrls || [data.imageUrl]` used to yield [undefined] when a
  // product had neither, which reached <Image src={undefined}>.
  const images = gallery.length > 0 ? gallery : cover ? [cover] : [];

  return {
    id,
    name: asText(data.name),
    description: asText(data.description),
    price: asNumber(data.price) ?? 0,
    currency: "XOF",
    images,
    imageUrl: cover ?? images[0],
    category: asText(data.category),
    storeId: asText(data.storeId),
    sellerId: asText(data.sellerId),
    storeName: "Boutique",
    rating: asNumber(data.averageRating) ?? 0,
    reviewCount: asNumber(data.reviewCount) ?? 0,
    stock: asNumber(data.quantity) ?? 0,
    status: asText(data.status),
  };
}

/* ------------------------------------------------------------------ */
/* stores/{storeId}                                                    */
/* ------------------------------------------------------------------ */

export type StoreProfile = {
  name: string;
  image: string;
  banner?: string;
  description?: string;
  /** Readable place. `location` is a GeoPoint and is never displayable. */
  location?: string;
  rating?: number;
  reviewCount?: number;
  subscriberCount?: number;
  phone?: string;
};

export const STORE_FALLBACK_IMAGE = "/images/app_icon.png";

/**
 * A store's readable place. `location` holds GeoPoint coordinates; the app
 * writes the human-readable place as `commune` and `ville`. A plain-string
 * `location` is still accepted for older documents.
 */
function placeOf(data: Record<string, unknown>): string | undefined {
  const parts = [asText(data.commune), asText(data.ville)].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return asText(data.location);
}

/**
 * Maps stores/{id} (keys: storeName, profileImageUrl, bannerImageUrl,
 * description, slogan, commune, ville, location, averageRating,
 * reviewCount, subscriberCount, phone, ownerId, isActive, isShopOpen)
 * or, for older products that stored the seller's uid as storeId,
 * users/{id} (displayName, photoURL).
 */
export function toStoreProfile(
  data: Record<string, unknown>,
  source: "stores" | "users"
): StoreProfile {
  const common = {
    banner: asText(data.bannerImageUrl),
    location: placeOf(data),
    rating: asNumber(data.averageRating),
    reviewCount: asNumber(data.reviewCount),
    subscriberCount: asNumber(data.subscriberCount),
    phone: asText(data.phone),
  };

  if (source === "stores") {
    return {
      ...common,
      name: firstText(data.storeName, data.name) ?? "Boutique",
      // profileImageUrl is the field the app writes; the logo/image/
      // storeImage names this code used to try match no real document,
      // so every storefront fell back to the placeholder.
      image:
        firstText(data.profileImageUrl, data.logo, data.image, data.storeImage) ??
        STORE_FALLBACK_IMAGE,
      description: firstText(data.description, data.slogan),
    };
  }

  return {
    ...common,
    name: firstText(data.displayName, data.storeName) ?? "Boutique",
    image:
      firstText(data.photoURL, data.profileImageUrl, data.logo, data.storeImage) ??
      STORE_FALLBACK_IMAGE,
    description: firstText(data.description, data.bio),
  };
}

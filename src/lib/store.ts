import { doc, getDoc, getDocs, collection, query, where, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type StoreProfile = {
  name: string;
  image: string;
  description?: string;
  location?: string;
};

export type StoreLookup = {
  profile: StoreProfile | null;
  /** True when a read failed (offline, permissions) rather than the store not existing. */
  failed: boolean;
};

const FALLBACK_IMAGE = "/images/app_icon.png";

/**
 * Firestore values reach the UI unchecked, and rendering a non-string as a
 * React child throws (error #31 — "Objects are not valid as a React child").
 * stores/{id}.location is a GeoPoint, which crashed the store page, so every
 * displayed field is narrowed to a non-empty string here.
 */
function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return undefined;
}

/**
 * A readable place for the store. `location` holds GeoPoint coordinates and
 * is never displayable; the app writes the human-readable place as `commune`
 * and `ville`. A plain-string `location` is still accepted, since older
 * documents may carry one.
 */
function placeOf(data: Record<string, unknown>): string | undefined {
  const parts = [asText(data.commune), asText(data.ville)].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return asText(data.location);
}

async function readDoc(path: "stores" | "users", id: string) {
  try {
    const snap = await getDoc(doc(db, path, id));
    return { data: snap.exists() ? snap.data() : null, failed: false };
  } catch (error) {
    console.error(`Error reading ${path}/${id}:`, error);
    return { data: null, failed: true };
  }
}

/**
 * Resolves the storefront for a product's `storeId`.
 *
 * `storeId` holds a stores/{id} document id, so that collection is
 * authoritative and is read first. Products written by the web seller
 * dashboard historically stored the seller's uid there instead, so
 * users/{id} stays as a fallback.
 *
 * Each read is guarded on its own. The previous version nested the stores
 * lookup inside the `else` branch of the users lookup, so a users read that
 * THREW — which is what signed-out visitors get, since the rules require
 * auth on users — skipped the stores lookup entirely and reported the store
 * as missing.
 */
export function toStoreProfile(
  data: Record<string, unknown>,
  source: "stores" | "users"
): StoreProfile {
  if (source === "stores") {
    return {
      name: firstText(data.storeName, data.name) ?? "Boutique",
      // profileImageUrl is the field the app actually writes; the older
      // logo/image/storeImage names never matched a real document, so every
      // storefront fell back to the placeholder icon.
      image:
        firstText(data.profileImageUrl, data.logo, data.image, data.storeImage) ??
        FALLBACK_IMAGE,
      description: firstText(data.description, data.slogan),
      location: placeOf(data),
    };
  }
  return {
    name: firstText(data.displayName, data.storeName) ?? "Boutique",
    image:
      firstText(data.photoURL, data.profileImageUrl, data.logo, data.storeImage) ??
      FALLBACK_IMAGE,
    description: firstText(data.description, data.bio),
    location: placeOf(data),
  };
}

export async function fetchStoreProfile(storeId: string): Promise<StoreLookup> {
  if (!storeId) return { profile: null, failed: false };

  const store = await readDoc("stores", storeId);
  if (store.data) {
    return { profile: toStoreProfile(store.data, "stores"), failed: false };
  }

  const user = await readDoc("users", storeId);
  if (user.data) {
    return { profile: toStoreProfile(user.data, "users"), failed: false };
  }

  // Only the authoritative stores read decides "failed". The users fallback
  // is legacy and is denied outright for signed-out visitors, so counting it
  // would report every genuinely deleted store as a load error.
  return { profile: null, failed: store.failed };
}

/**
 * Store names for a grid of products, keyed by storeId.
 *
 * Deduplicates ids and reads them in `in` batches of ten (Firestore's limit)
 * so a catalogue page costs a couple of queries rather than one read per
 * card. Failures resolve to an empty map: cards fall back to their default
 * label rather than the grid failing.
 */
export async function fetchStoreNames(storeIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(storeIds.filter(Boolean))];
  if (unique.length === 0) return names;

  for (let i = 0; i < unique.length; i += 10) {
    const batch = unique.slice(i, i + 10);
    try {
      const snap = await getDocs(
        query(collection(db, "stores"), where(documentId(), "in", batch))
      );
      snap.docs.forEach((d) => {
        const data = d.data();
        names.set(d.id, firstText(data.storeName, data.name) ?? "Boutique");
      });
    } catch (error) {
      console.error("Error reading store names:", error);
    }
  }
  return names;
}

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
export async function fetchStoreProfile(storeId: string): Promise<StoreLookup> {
  if (!storeId) return { profile: null, failed: false };

  const store = await readDoc("stores", storeId);
  if (store.data) {
    const d = store.data;
    return {
      profile: {
        name: d.name || d.storeName || "Boutique",
        image: d.logo || d.image || d.storeImage || FALLBACK_IMAGE,
        description: d.description,
        location: d.location,
      },
      failed: false,
    };
  }

  const user = await readDoc("users", storeId);
  if (user.data) {
    const d = user.data;
    return {
      profile: {
        name: d.displayName || d.storeName || "Boutique",
        image: d.photoURL || d.logo || d.storeImage || FALLBACK_IMAGE,
        description: d.description || d.bio,
        location: d.location,
      },
      failed: false,
    };
  }

  return { profile: null, failed: store.failed || user.failed };
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
        names.set(d.id, data.name || data.storeName || "Boutique");
      });
    } catch (error) {
      console.error("Error reading store names:", error);
    }
  }
  return names;
}

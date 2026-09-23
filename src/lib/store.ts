import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  documentId,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  COLLECTIONS,
  firstText,
  toStoreProfile,
  type StoreProfile,
} from "@/lib/firestore-schema";

export type { StoreProfile };

export type StoreLookup = {
  profile: StoreProfile | null;
  /** True when a read failed (offline, permissions) rather than the store not existing. */
  failed: boolean;
};

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
 * Each read is guarded on its own. A nested version put the stores lookup
 * inside the `else` branch of the users lookup, so a users read that THREW
 * — which is what signed-out visitors get, since the rules require auth on
 * users — skipped the stores lookup entirely.
 */
export async function fetchStoreProfile(storeId: string): Promise<StoreLookup> {
  if (!storeId) return { profile: null, failed: false };

  const store = await readDoc(COLLECTIONS.stores, storeId);
  if (store.data) {
    return { profile: toStoreProfile(store.data, "stores"), failed: false };
  }

  const user = await readDoc(COLLECTIONS.users, storeId);
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
 * Deduplicates ids and reads them in `in` batches of ten (Firestore's
 * limit) so a catalogue page costs a couple of queries rather than one read
 * per card. Failures resolve to an empty map: cards keep their default
 * label rather than the grid failing.
 */
export async function fetchStoreNames(storeIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(storeIds.filter(Boolean))];
  if (unique.length === 0) return names;

  for (let index = 0; index < unique.length; index += 10) {
    const batch = unique.slice(index, index + 10);
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.stores), where(documentId(), "in", batch))
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

/**
 * The stores/{id} document id owned by a seller.
 *
 * A store document carries the seller as `ownerId`; its own id is an
 * auto-id, NOT the seller's uid. The seller dashboard assumed the two were
 * the same, which meant it listed products by the wrong storeId (returning
 * nothing) and wrote new products with storeId = uid — rejected, because
 * `isStoreOwner` resolves stores/{storeId}.ownerId and stores/{uid} does
 * not exist.
 */
export async function findStoreIdByOwner(ownerId: string): Promise<string | null> {
  if (!ownerId) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, COLLECTIONS.stores),
        where("ownerId", "==", ownerId),
        limit(1)
      )
    );
    return snap.empty ? null : snap.docs[0].id;
  } catch (error) {
    console.error("Error resolving store for owner:", error);
    return null;
  }
}

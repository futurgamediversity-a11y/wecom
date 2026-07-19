"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { type CartItem } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  favorites: string[];
  cartItems: CartItem[];
  toggleFavorite: (productId: string) => Promise<void>;
  addToCart: (item: Omit<CartItem, "id" | "buyerId" | "timestamp">) => Promise<void>;
  removeFromCart: (cartDocId: string) => Promise<void>;
  updateCartQty: (cartDocId: string, delta: number, currentQty: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    let unsubscribeFavorites: (() => void) | null = null;
    let unsubscribeCart: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Create user document if it doesn't exist
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, "users", currentUser.uid), {
              displayName: currentUser.displayName,
              email: currentUser.email,
              createdAt: new Date(),
              favorites: []
            });
          }
        } catch (error) {
          console.error("Error with user document:", error);
        }

        // Real-time listener for favorites
        const favQuery = query(collection(db, "favorites"), where("userId", "==", currentUser.uid));
        unsubscribeFavorites = onSnapshot(favQuery, (snap) => {
          setFavorites(snap.docs.map(d => d.data().productId as string));
        });

        // Real-time listener for cart
        const cartQuery = query(collection(db, "cart"), where("buyerId", "==", currentUser.uid));
        unsubscribeCart = onSnapshot(cartQuery, (snap) => {
          const items: CartItem[] = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              productId: data.productId,
              buyerId: data.buyerId,
              name: data.name,
              price: data.price,
              quantity: data.quantity,
              imageUrl: data.imageUrl,
              storeId: data.storeId || "",
              selectedVariants: data.selectedVariants || {},
              timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : undefined,
            };
          });
          // Sort by timestamp descending
          items.sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));
          setCartItems(items);
        });
      } else {
        setFavorites([]);
        setCartItems([]);
        if (unsubscribeFavorites) { unsubscribeFavorites(); unsubscribeFavorites = null; }
        if (unsubscribeCart) { unsubscribeCart(); unsubscribeCart = null; }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFavorites) unsubscribeFavorites();
      if (unsubscribeCart) unsubscribeCart();
    };
  }, []);

  // Toggle favorite
  const toggleFavorite = async (productId: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      if (favorites.includes(productId)) {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("productId", "==", productId)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) await deleteDoc(d.ref);
        await updateDoc(userDocRef, { favorites: arrayRemove(productId) });
      } else {
        await addDoc(collection(db, "favorites"), {
          productId,
          userId: user.uid,
          timestamp: Timestamp.now()
        });
        await updateDoc(userDocRef, { favorites: arrayUnion(productId) });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Add item to cart (merge if same productId + variants already in cart)
  const addToCart = async (item: Omit<CartItem, "id" | "buyerId" | "timestamp">) => {
    if (!user) return;
    try {
      // Check if identical product+variants already in cart
      const variantsKey = JSON.stringify(item.selectedVariants ?? {});
      const existing = cartItems.find(
        c => c.productId === item.productId && JSON.stringify(c.selectedVariants ?? {}) === variantsKey
      );
      if (existing) {
        // Increment quantity
        await updateDoc(doc(db, "cart", existing.id), {
          quantity: increment(item.quantity),
          timestamp: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, "cart"), {
          ...item,
          buyerId: user.uid,
          timestamp: Timestamp.now()
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartDocId: string) => {
    try {
      await deleteDoc(doc(db, "cart", cartDocId));
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  // Update cart item quantity
  const updateCartQty = async (cartDocId: string, delta: number, currentQty: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeFromCart(cartDocId);
      return;
    }
    try {
      await updateDoc(doc(db, "cart", cartDocId), { quantity: newQty });
    } catch (error) {
      console.error("Error updating cart quantity:", error);
    }
  };

  // Google sign-in
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", currentUser.uid), {
          displayName: currentUser.displayName,
          email: currentUser.email,
          createdAt: new Date(),
          favorites: []
        });
      }
    } catch (error) {
      console.error("Google sign in error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, favorites, cartItems, toggleFavorite, addToCart, removeFromCart, updateCartQty, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}



"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp, onSnapshot } from "firebase/firestore";

interface Favorite {
  productId: string;
  userId: string;
  timestamp: Timestamp;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  favorites: string[];
  toggleFavorite: (productId: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribeFavorites: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid);
      setUser(currentUser);
      
      if (currentUser) {
        // Create user document if it doesn't exist
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists()) {
            console.log("Creating new user document for:", currentUser.uid);
            await setDoc(doc(db, "users", currentUser.uid), {
              displayName: currentUser.displayName,
              email: currentUser.email,
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error("Error with user document:", error);
        }
        
        // Set up real-time listener for user's favorites
        console.log("Setting up favorites listener for user:", currentUser.uid);
        const q = query(collection(db, "favorites"), where("userId", "==", currentUser.uid));
        unsubscribeFavorites = onSnapshot(q, (querySnapshot) => {
          const favoriteProductIds = querySnapshot.docs.map(doc => doc.data().productId as string);
          console.log("Updated favorites:", favoriteProductIds);
          setFavorites(favoriteProductIds);
        }, (error) => {
          console.error("Error listening to favorites:", error);
        });
      } else {
          console.log("User logged out, clearing favorites");
          setFavorites([]);
          if (unsubscribeFavorites) {
            unsubscribeFavorites();
            unsubscribeFavorites = null;
          }
        }
      
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth listeners");
      unsubscribeAuth();
      if (unsubscribeFavorites) unsubscribeFavorites();
    };
  }, []);

  // Toggle favorite product
  const toggleFavorite = async (productId: string) => {
    if (!user) {
      console.warn("Cannot toggle favorite: user not logged in");
      return;
    }
    
    console.log("Toggling favorite for product:", productId, "user:", user.uid);
    
    try {
      if (favorites.includes(productId)) {
        // Remove from favorites
        console.log("Removing product from favorites");
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("productId", "==", productId)
        );
        const querySnapshot = await getDocs(q);
        console.log("Found", querySnapshot.docs.length, "documents to delete");
        for (const doc of querySnapshot.docs) {
          console.log("Deleting document:", doc.id);
          await deleteDoc(doc.ref);
        }
      } else {
        // Add to favorites
        console.log("Adding product to favorites");
        const docRef = await addDoc(collection(db, "favorites"), {
          productId,
          userId: user.uid,
          timestamp: Timestamp.now()
        });
        console.log("Added favorite document:", docRef.id);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const currentUser = userCredential.user;
      
      // Create user document if it doesn't exist
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
    <AuthContext.Provider value={{ user, loading, favorites, toggleFavorite, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

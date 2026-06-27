"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp } from "firebase/firestore";

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
      setUser(currentUser);
      
      if (currentUser) {
        // Create user document if it doesn't exist
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, "users", currentUser.uid), {
              displayName: currentUser.displayName,
              email: currentUser.email,
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error("Error with user document:", error);
        }
        
        // Fetch user's favorites from "favorites" collection
        const fetchFavorites = async () => {
          try {
            const q = query(collection(db, "favorites"), where("userId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            const favoriteProductIds = querySnapshot.docs.map(doc => doc.data().productId as string);
            setFavorites(favoriteProductIds);
          } catch (error) {
            console.error("Error fetching favorites:", error);
          }
        };
        
        fetchFavorites();
      } else {
          setFavorites([]);
        }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFavorites) unsubscribeFavorites();
    };
  }, []);

  // Toggle favorite product
  const toggleFavorite = async (productId: string) => {
    if (!user) return;
    
    try {
      if (favorites.includes(productId)) {
        // Remove from favorites
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid),
          where("productId", "==", productId)
        );
        const querySnapshot = await getDocs(q);
        for (const doc of querySnapshot.docs) {
          await deleteDoc(doc.ref);
        }
        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        // Add to favorites
        await addDoc(collection(db, "favorites"), {
          productId,
          userId: user.uid,
          timestamp: Timestamp.now()
        });
        setFavorites(prev => [...prev, productId]);
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

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user's favorites from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setFavorites(userDoc.data().favorites || []);
          } else {
            // Create user document if it doesn't exist
            await setDoc(doc(db, "users", currentUser.uid), {
              displayName: currentUser.displayName,
              email: currentUser.email,
              createdAt: new Date(),
              favorites: []
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setFavorites([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Toggle favorite product
  const toggleFavorite = async (productId: string) => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    
    try {
      if (favorites.includes(productId)) {
        // Remove from favorites
        await updateDoc(userDocRef, {
          favorites: arrayRemove(productId)
        });
        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        // Add to favorites
        await updateDoc(userDocRef, {
          favorites: arrayUnion(productId)
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

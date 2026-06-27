"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setDisplayName(user.displayName || "");
        setEmail(user.email || "");
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().displayName) {
          setDisplayName(userDoc.data().displayName);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      if (auth.currentUser && displayName !== user.displayName) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: displayName
        });
      }
      
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName
      });

      router.push("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-8">
        <p>Chargement...</p>
      </main>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-black">Modifier mon profil</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Mettez à jour vos informations personnelles.
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-neutral-900">
              Nom complet
            </label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-neutral-900">
              Email
            </label>
            <Input
              value={email}
              disabled
              className="mt-1 bg-neutral-100"
            />
            <p className="mt-1 text-xs text-neutral-500">
              L'email ne peut pas être modifié.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/profile")}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}

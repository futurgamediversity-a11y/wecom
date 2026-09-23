"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";

/**
 * Port of lib/screens/register_screen.dart — same visual register card
 * as login: name + email + password fields, primary orange CTA, link back to login.
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  function messageFor(error: { code?: string; message?: string }) {
    switch (error.code) {
      case "auth/operation-not-allowed":
        return "La connexion Google n'est pas activée sur ce projet Firebase.";
      case "auth/unauthorized-domain":
        return "Ce domaine n'est pas autorisé dans Firebase Authentication.";
      case "auth/popup-blocked":
        return "La fenêtre Google a été bloquée par le navigateur.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Inscription Google annulée.";
      case "auth/email-already-in-use":
        return "Un compte existe déjà avec cette adresse e-mail.";
      case "auth/weak-password":
        return "Le mot de passe doit contenir au moins 6 caractères.";
      default:
        return error.message || "Erreur lors de la création du compte.";
    }
  }

  /**
   * Google sign-up. signInWithPopup covers both cases: Firebase creates the
   * account on first use, and signInWithGoogle writes the users/{uid}
   * document when it does not already exist, so the same call serves
   * sign-up and sign-in.
   */
  async function handleGoogleSignUp() {
    setLoading(true);
    setErr(null);
    try {
      await signInWithGoogle();
      window.location.href = "/role";
    } catch (error: any) {
      console.error("Google sign up error:", error);
      setErr(messageFor(error));
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) {
      setErr("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Update profile with display name
      if (user) {
        await updateProfile(user, {
          displayName: name
        });
        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          displayName: name,
          email: email,
          createdAt: new Date()
        });
      }
      
      // Redirect to role page
      window.location.href = "/role";
    } catch (error: any) {
      console.error("Registration error:", error);
      setErr(messageFor(error));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-wcom-offwhite">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
        <Card className="w-full px-8 py-10">
          <div className="flex justify-center">
            <div className="relative h-24 w-24">
              <Image
                src="/images/app_icon.png"
                alt="W-COM"
                fill
                sizes="96px"
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold text-black">
            Rejoignez W-COM
          </h1>
          <p className="mt-2 text-center text-sm text-neutral-500">
            Un compte unique pour acheter, vendre ou gérer votre activité.
          </p>

          {err ? (
            <p className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-semibold">Nom complet</label>
              <div className="mt-2">
                <Input
                  placeholder="Entrez votre nom"
                  leadingIcon={<User className="h-4 w-4" />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Adresse e-mail</label>
              <div className="mt-2">
                <Input
                  type="email"
                  placeholder="vous@exemple.com"
                  leadingIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Mot de passe</label>
                <div className="mt-2">
                  <Input
                    type="password"
                    placeholder="Au moins 8 caractères"
                    leadingIcon={<Lock className="h-4 w-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Confirmation</label>
                <div className="mt-2">
                  <Input
                    type="password"
                    placeholder="Retapez votre mot de passe"
                    leadingIcon={<Lock className="h-4 w-4" />}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">ou</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="md"
            className="mt-6 w-full gap-3"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <span className="text-blue-500 text-lg font-black">G</span>
            S&apos;inscrire avec Google
          </Button>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-bold text-wcom-orange hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}

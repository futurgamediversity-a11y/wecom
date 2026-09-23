"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Mail, Lock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

/**
 * Port of lib/screens/login_screen.dart.
 * Light off-white background, centered white card with subtle border + shadow,
 * orange primary CTA, green outlined "create account" button.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  /**
   * Where to land after signing in. Pages that send a visitor here (the
   * product page's "Connectez-vous d'abord") pass ?next=; only same-site
   * paths are accepted, so the parameter cannot be used as an open redirect.
   */
  function destination() {
    if (typeof window === "undefined") return "/role";
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
    return "/role";
  }

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
        return "Connexion Google annulée.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-mail ou mot de passe incorrect.";
      default:
        return error.message || "Erreur de connexion.";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErr(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = destination();
    } catch (error: any) {
      console.error("Login error:", error);
      setErr(messageFor(error));
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setErr(null);
    try {
      await signInWithGoogle();
      window.location.href = destination();
    } catch (error: any) {
      console.error("Google sign in error:", error);
      // Only redirect on success — this used to navigate to /role even
      // when the popup failed, leaving the visitor signed out.
      setErr(messageFor(error));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-wcom-offwhite">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
        <Card className="w-full px-8 py-10">
          {/* Logo */}
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
            Connectez-vous pour continuer
          </h1>

          {err ? (
            <p className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="text-sm font-semibold">Adresse e-mail</label>
              <div className="mt-2">
                <Input
                  type="email"
                  placeholder="Entrez votre e-mail"
                  leadingIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Mot de passe</label>
                <button
                  type="button"
                  className="text-xs font-medium text-wcom-orange hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="mt-2">
                <Input
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  leadingIcon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs uppercase tracking-wide text-neutral-400">
              ou
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* Social */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full gap-3"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <span className="text-blue-500 text-lg font-black">G</span>
              Continuer avec Google
            </Button>
            <Button variant="outline" size="md" className="w-full gap-3">
              <ShoppingBag className="h-4 w-4" />
              Continuer avec Apple
            </Button>
          </div>

          {/* Create account */}
          <Link href="/register" className="mt-4 block">
            <Button variant="secondary" size="md" className="w-full">
              Créer un compte
            </Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}

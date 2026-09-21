import type { NextConfig } from "next";

const FIREBASE_KEYS = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID",
] as const;

// Firebase's web config is public by design — it ships in the browser bundle
// of every Firebase web app, and access is controlled by Firestore/Storage
// rules, not by hiding these values.
//
// Next.js only inlines a variable into that bundle when the name is prefixed
// NEXT_PUBLIC_ or listed here, so map the unprefixed names used in the
// hosting provider. NEXT_PUBLIC_* is still accepted as a fallback so existing
// .env.local files and deployment environments keep working.
const firebaseEnv = Object.fromEntries(
  FIREBASE_KEYS.map((key) => [
    key,
    process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`] ?? "",
  ])
);

const nextConfig: NextConfig = {
  env: firebaseEnv,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
  const API_KEY = process.env.CLOUDINARY_API_KEY || "";
  const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: "Configuration Cloudinary manquante sur le serveur." },
      { status: 500 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);

  // Generate signature: sign "timestamp=<ts>" with SHA-1 + secret
  const str = `timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(str).digest("hex");

  return NextResponse.json({
    signature,
    timestamp,
    api_key: API_KEY,
    cloud_name: CLOUD_NAME,
  });
}

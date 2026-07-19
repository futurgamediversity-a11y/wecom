import { NextResponse } from "next/server";
import crypto from "crypto";

const CLOUD_NAME = "dphosg8ng";
const API_KEY = "379877889227923";
const API_SECRET = "058fd4TIjHHVG09KQ8_JfAfGif4";

export async function POST() {
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

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount } = body;

    // Keys that the user will need to configure in their environment variables:
    const apiKey = process.env.SAASPAY_API_KEY;
    const merchantId = process.env.SAASPAY_MERCHANT_ID;
    
    // In production, you would call the SasPay API here.
    // Example:
    // const saspayResponse = await fetch("https://api.saspay.me/v1/payments/init", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     merchantId,
    //     amount,
    //     currency: "XOF",
    //     returnUrl: "https://votre-site.com/orders?success=1",
    //     cancelUrl: "https://votre-site.com/checkout",
    //     description: "Paiement W-COM"
    //   })
    // });
    // const saspayData = await saspayResponse.json();
    
    // For now, since we don't have the real keys or exact payload shape yet,
    // we return a mock URL. If keys exist, you'd return saspayData.paymentUrl
    
    if (!apiKey || !merchantId) {
      console.warn("⚠️ SAASPAY_API_KEY ou SAASPAY_MERCHANT_ID manquant. Mode simulation activé.");
    }

    // Mock redirect simulating SasPay checkout page
    // (In reality this will be a URL returned by SasPay API)
    return NextResponse.json({ 
      paymentUrl: "/orders?success=1&method=saaspay" 
    });
    
  } catch (error) {
    console.error("Erreur SaasPay:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du paiement." },
      { status: 500 }
    );
  }
}

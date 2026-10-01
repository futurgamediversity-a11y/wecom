import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount } = body;

    // Clés que tu devras configurer dans ton fichier .env / Vercel :
    const siteId = process.env.GENIUSPAY_SITE_ID;
    const apiKey = process.env.GENIUSPAY_API_KEY;
    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET; // Pour vérifier les retours de GeniusPay
    
    // Exemple d'appel en production (selon la documentation GeniusPay) :
    // const response = await fetch("https://api.geniuspay.com/v1/payments", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     site_id: siteId,
    //     amount: amount,
    //     currency: "XOF",
    //     return_url: "https://votre-site.com/orders?success=1",
    //     cancel_url: "https://votre-site.com/checkout",
    //     notify_url: "https://votre-site.com/api/geniuspay/webhook", // L'URL de ton Webhook
    //     metadata: { source: "W-COM" }
    //   })
    // });
    // const data = await response.json();
    
    if (!apiKey || !siteId) {
      console.warn("⚠️ GENIUSPAY_API_KEY ou GENIUSPAY_SITE_ID manquant. Mode simulation activé.");
    }

    // Redirection factice vers la page de succès pour la simulation
    // En réel, tu retournerais `data.payment_url`
    return NextResponse.json({ 
      paymentUrl: "/orders?success=1&method=geniuspay" 
    });
    
  } catch (error) {
    console.error("Erreur GeniusPay:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du paiement." },
      { status: 500 }
    );
  }
}

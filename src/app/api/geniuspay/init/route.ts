import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount } = body;

    // Récupération de tes clés GeniusPay depuis l'environnement
    const apiKey = process.env.GENIUSPAY_API_KEY;       // Clé publique (ex: pk_live_...)
    const apiSecret = process.env.GENIUSPAY_API_SECRET; // Clé secrète (ex: sk_live_...)
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Veuillez configurer GENIUSPAY_API_KEY et GENIUSPAY_API_SECRET dans Vercel." },
        { status: 500 }
      );
    }

    // Appel REEL à l'API de GeniusPay pour initialiser le paiement
    const response = await fetch("https://pay.genius.ci/api/v1/merchant/payments", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        description: "Commande sur W-COM"
      })
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Erreur de l'API GeniusPay:", errData);
      return NextResponse.json(
        { error: "Refus de GeniusPay, vérifiez vos clés API." },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    // GeniusPay retourne normalement une 'checkout_url' pour la page de paiement
    if (data && data.checkout_url) {
      return NextResponse.json({ paymentUrl: data.checkout_url });
    } else {
      console.error("Pas de checkout_url retournée:", data);
      return NextResponse.json(
        { error: "Erreur lors de la création du lien de paiement." },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Erreur GeniusPay:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du paiement." },
      { status: 500 }
    );
  }
}

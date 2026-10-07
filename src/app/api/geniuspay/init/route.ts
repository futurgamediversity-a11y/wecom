import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, returnUrl } = body;

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 200) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre d'au moins 200 XOF." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GENIUSPAY_API_KEY;
    const apiSecret = process.env.GENIUSPAY_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Le paiement est indisponible : les identifiants GeniusPay ne sont pas configurés." },
        { status: 503 }
      );
    }

    const response = await fetch("https://pay.genius.ci/api/v1/merchant/payments", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        description: "Commande sur W-COM", ...(returnUrl ? { return_url: returnUrl, cancel_url: returnUrl } : {})
      })
    });

    const responseBody: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        typeof responseBody === "object" && responseBody !== null &&
        "error" in responseBody && typeof responseBody.error === "object" &&
        responseBody.error !== null && "message" in responseBody.error &&
        typeof responseBody.error.message === "string"
          ? responseBody.error.message
          : `GeniusPay a répondu avec le statut ${response.status}.`;
      console.error("Erreur de l'API GeniusPay:", response.status, errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 502 }
      );
    }

    const paymentData =
      typeof responseBody === "object" && responseBody !== null && "data" in responseBody
        ? responseBody.data
        : null;
    const paymentUrl =
      typeof paymentData === "object" && paymentData !== null && "checkout_url" in paymentData
        ? paymentData.checkout_url
        : null;

    if (typeof paymentUrl === "string") {
      try {
        if (new URL(paymentUrl).protocol === "https:") {
          return NextResponse.json({ paymentUrl });
        }
      } catch {
        // Treat malformed payment URLs as an invalid GeniusPay response.
      }
    }

    if (!paymentUrl) {
      console.error("Réponse GeniusPay sans data.checkout_url:", responseBody);
    } else {
      console.error("URL GeniusPay invalide:", paymentUrl);
    }

    return NextResponse.json(
      { error: "GeniusPay n'a pas retourné de lien de paiement valide." },
      { status: 502 }
    );
    
  } catch (error) {
    console.error("Erreur GeniusPay:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du paiement." },
      { status: 500 }
    );
  }
}


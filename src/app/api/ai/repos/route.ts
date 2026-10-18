import { NextResponse } from "next/server";

interface CatalogProduct {
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
}

interface HistoryItem {
  sender?: string;
  text?: string;
}

interface StoreData {
  name?: string;
  plan?: string;
  totalRevenue?: number;
  monthlyRevenue?: number;
  ordersCount?: number;
  monthlyOrdersCount?: number;
  products?: CatalogProduct[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, storeData, history } = body as {
      message?: string;
      storeData?: StoreData;
      history?: HistoryItem[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message requis." }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Build real business context from seller's actual Firestore data
    const storeName = storeData?.name || "Boutique W-COM";
    const plan = storeData?.plan || "Mensuel";
    const totalRevenue = storeData?.totalRevenue ?? 0;
    const monthlyRevenue = storeData?.monthlyRevenue ?? 0;
    const ordersCount = storeData?.ordersCount ?? 0;
    const monthlyOrdersCount = storeData?.monthlyOrdersCount ?? 0;
    const products: CatalogProduct[] = Array.isArray(storeData?.products) ? storeData.products : [];

    const productsSummary =
      products.length > 0
        ? products
            .map(
              (p) =>
                `- "${p.name || "Article"}": ${p.price ?? 0} XOF (Stock: ${p.quantity ?? 0}, Catégorie: ${p.category || "Général"})`
            )
            .join("\n")
        : "Aucun produit actuellement en vente.";

    const systemPrompt = `Tu es "Repos", l'assistant IA officiel et copilote business de W-COM, la grande place de marché numérique de Côte d'Ivoire (Abidjan).
Tu t'adresses directement au gérant de la boutique "${storeName}". Ton ton est amical, professionnel, encourageant, perspicace et adapté au marché ivoirien.

DONNÉES EN TEMPS RÉEL DE LA BOUTIQUE DU VENDEUR :
- Nom de la boutique : ${storeName}
- Formule d'abonnement : W-COM ${plan}
- Chiffre d'affaires total historique : ${totalRevenue.toLocaleString("fr-FR")} FCFA (XOF)
- Chiffre d'affaires de ce mois : ${monthlyRevenue.toLocaleString("fr-FR")} FCFA (XOF)
- Nombre total de commandes : ${ordersCount}
- Commandes enregistrées ce mois : ${monthlyOrdersCount}
- Catalogue de produits (${products.length} articles) :
${productsSummary}

DIRECTIVES :
1. Réponds toujours en français, avec clarté, concision et structure (utilise des listes à puces si pertinent).
2. Utilise les chiffres et données réels ci-dessus pour répondre de manière ultra précise (revenus, stock critique ≤ 3, prix moyen, etc.).
3. Si le vendeur demande des conseils pour vendre plus, propose des stratégies adaptées au contexte ivoirien (WhatsApp status marketing, promos de fin de mois, ciblage géographique à Abidjan : Cocody, Yopougon, Marcory, Plateau, livraison rapide W-COM).
4. Sois concis, pragmatique et direct. Ne fais jamais de réponses inutilement verbeuses.`;

    if (apiKey) {
      // List of Gemini models to attempt
      const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

      // Format history for Gemini API
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history.slice(-6)) {
          contents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text || "" }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      for (const model of models) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(geminiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 600,
              },
            }),
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) {
              return NextResponse.json({ reply });
            }
          } else {
            console.warn(`Gemini (${model}) returned status: ${geminiRes.status}`);
          }
        } catch (modelErr) {
          console.warn(`Gemini (${model}) call failed:`, modelErr);
        }
      }
    }

    // Dynamic intelligent fallback based on seller's live Firestore data
    const lower = message.toLowerCase();
    let dynamicReply = "";

    if (
      lower.includes("revenu") ||
      lower.includes("chiffre") ||
      lower.includes("gagné") ||
      lower.includes("argent") ||
      lower.includes("ca") ||
      lower.includes("vente")
    ) {
      dynamicReply = `📊 **Bilan Financier de ${storeName}** :\n\n- **Chiffre d'affaires ce mois-ci** : **${monthlyRevenue.toLocaleString("fr-FR")} FCFA** (${monthlyOrdersCount} commande(s)).\n- **Chiffre d'affaires global cumulé** : **${totalRevenue.toLocaleString("fr-FR")} FCFA** sur ${ordersCount} commande(s) au total.\n\n💡 *Conseil de Repos* : Vos ventes progressent bien ! Pensez à partager vos fiches produits directement sur vos statuts WhatsApp pour accélérer vos commandes cette semaine.`;
    } else if (
      lower.includes("stock") ||
      lower.includes("produit") ||
      lower.includes("rupture") ||
      lower.includes("quantité") ||
      lower.includes("article")
    ) {
      const lowStock = products.filter((p) => (p.quantity ?? 0) <= 3);
      if (lowStock.length > 0) {
        dynamicReply = `⚠️ **Alerte Stocks pour ${storeName}** :\n\nVous avez **${lowStock.length} article(s)** avec un niveau de stock critique (≤ 3 unités) :\n${lowStock
          .map(
            (p) =>
              `• **${p.name || "Article"}** : reste ${p.quantity ?? 0} en stock (${(p.price ?? 0).toLocaleString("fr-FR")} FCFA)`
          )
          .join("\n")}\n\n👉 Pensez à réapprovisionner ces articles rapidement pour éviter toute rupture face aux commandes de vos clients.`;
      } else {
        dynamicReply = `✅ **Gestion des Stocks** :\n\nVous avez actuellement **${products.length} produit(s)** en ligne. Tous vos stocks sont à un niveau satisfaisant (aucun article en rupture critique). N'hésitez pas à élargir votre catalogue pour attirer davantage d'acheteurs !`;
      }
    } else if (
      lower.includes("conseil") ||
      lower.includes("augmenter") ||
      lower.includes("vendre") ||
      lower.includes("optimis") ||
      lower.includes("booster") ||
      lower.includes("croissance")
    ) {
      dynamicReply = `🚀 **Mes 3 recommandations pour booster ${storeName}** :\n\n1. **Activez les ventes flash** : Les acheteurs adorent les réductions temporaires en début et fin de mois.\n2. **Misez sur la livraison express W-COM** : Mentionnez dans vos descriptions la livraison rapide partout à Abidjan pour rassurer vos clients.\n3. **Partagez votre boutique** : Diffusez vos produits avec le visuel « Ce que j'achète » sur WhatsApp et les réseaux sociaux !`;
    } else {
      dynamicReply = `Bonjour ! Je suis **Repos**, votre copilote IA pour la boutique **${storeName}**.\n\nVous avez actuellement **${products.length} produit(s)** en vente pour un chiffre d'affaires mensuel de **${monthlyRevenue.toLocaleString("fr-FR")} FCFA**.\n\nPosez-moi des questions sur vos revenus, vos stocks, ou demandez-moi des conseils personnalisés pour développer votre activité !`;
    }

    return NextResponse.json({ reply: dynamicReply });
  } catch (error: unknown) {
    console.error("Erreur serveur route Repos AI:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la communication avec l'assistant Repos." },
      { status: 500 }
    );
  }
}

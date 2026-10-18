import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, storeData, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message requis." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Build real business context from seller's actual Firestore data
    const storeName = storeData?.name || "Boutique W-COM";
    const plan = storeData?.plan || "Mensuel";
    const totalRevenue = storeData?.totalRevenue ?? 0;
    const monthlyRevenue = storeData?.monthlyRevenue ?? 0;
    const ordersCount = storeData?.ordersCount ?? 0;
    const monthlyOrdersCount = storeData?.monthlyOrdersCount ?? 0;
    const products = Array.isArray(storeData?.products) ? storeData.products : [];

    const productsSummary = products.length > 0
      ? products.map((p: any) => `- "${p.name}": ${p.price} XOF (Stock: ${p.quantity}, Catégorie: ${p.category})`).join("\n")
      : "Aucun produit actuellement en vente.";

    const systemPrompt = `Tu es "Rust", l'assistant IA officiel et conseiller business d'élite de W-COM, la grande place de marché numérique de Côte d'Ivoire (Abidjan).
Tu t'adresses au gérant de la boutique "${storeName}". Ton ton est professionnel, chaleureux, encourageant et pragmatique, adapté à l'écosystème commercial ivoirien.

DONNÉES EN TEMPS RÉEL DE LA BOUTIQUE DU VENDEUR :
- Nom de la boutique : ${storeName}
- Formule d'abonnement : W-COM ${plan}
- Chiffre d'affaires total historique : ${totalRevenue.toLocaleString("fr-FR")} FCFA (XOF)
- Chiffre d'affaires de ce mois : ${monthlyRevenue.toLocaleString("fr-FR")} FCFA (XOF)
- Nombre de commandes totales : ${ordersCount}
- Commandes enregistrées ce mois : ${monthlyOrdersCount}
- Catalogue de produits (${products.length} articles) :
${productsSummary}

DIRECTIVES :
1. Réponds toujours en français, de façon claire, concise et structurée (avec des puces ou des chiffres clés si pertinent).
2. Utilise les chiffres et données réels ci-dessus pour répondre avec une précision totale (sur les revenus, les stocks bas, le prix moyen, etc.).
3. Si le vendeur demande des conseils pour vendre plus, propose des stratégies concrètes adaptées au marché ivoirien (promotions de fin de mois, ciblage des communes d'Abidjan comme Cocody ou Marcory, WhatsApp marketing, livraison express W-COM).
4. Sois concis et direct, évite les réponses inutilement longues.`;

    if (apiKey) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        // Format history for Gemini
        const contents = [];
        if (Array.isArray(history) && history.length > 0) {
          for (const h of history.slice(-6)) {
            contents.push({
              role: h.sender === "user" ? "user" : "model",
              parts: [{ text: h.text }]
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });

        const geminiRes = await fetch(geminiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply });
          }
        } else {
          console.error("Gemini API error status:", geminiRes.status);
        }
      } catch (geminiErr) {
        console.error("Erreur appel direct Gemini API:", geminiErr);
      }
    }

    // Dynamic intelligent fallback based on seller's real data
    const lower = message.toLowerCase();
    let dynamicReply = "";

    if (lower.includes("revenu") || lower.includes("chiffre") || lower.includes("gagné") || lower.includes("argent") || lower.includes("ca")) {
      dynamicReply = `📊 **Bilan Financier de ${storeName}** :\n\n- **Chiffre d'affaires ce mois-ci** : **${monthlyRevenue.toLocaleString("fr-FR")} FCFA** (${monthlyOrdersCount} commande(s)).\n- **Chiffre d'affaires global cumulé** : **${totalRevenue.toLocaleString("fr-FR")} FCFA** sur ${ordersCount} commande(s) au total.\n\n💡 *Astuce de Rust* : Vos ventes progressent bien ! Pensez à partager vos fiches produits directement sur vos statuts WhatsApp pour accélérer vos commandes cette semaine.`;
    } else if (lower.includes("stock") || lower.includes("produit") || lower.includes("rupture") || lower.includes("quantité")) {
      const lowStock = products.filter((p: any) => p.quantity <= 3);
      if (lowStock.length > 0) {
        dynamicReply = `⚠️ **Alerte Stocks pour ${storeName}** :\n\nVous avez **${lowStock.length} article(s)** avec un niveau de stock critique (≤ 3 unités) :\n${lowStock.map((p: any) => `• **${p.name}** : reste ${p.quantity} en stock (${p.price.toLocaleString("fr-FR")} FCFA)`).join("\n")}\n\n👉 Pensez à réapprovisionner ces articles rapidement pour éviter toute rupture face aux commandes de vos clients.`;
      } else {
        dynamicReply = `✅ **Gestion des Stocks** :\n\nVous avez actuellement **${products.length} produit(s)** en ligne. Tous vos stocks sont à un niveau satisfaisant (aucun article en rupture critique). N'hésitez pas à élargir votre catalogue pour attirer davantage d'acheteurs !`;
      }
    } else if (lower.includes("conseil") || lower.includes("augmenter") || lower.includes("vendre") || lower.includes("optimis") || lower.includes("booster")) {
      dynamicReply = `🚀 **Mes 3 recommandations pour booster ${storeName}** :\n\n1. **Activez les ventes flash** : Les acheteurs ivoiriens adorent les réductions temporaires en début et fin de mois.\n2. **Misez sur la livraison express W-COM** : Mentionnez dans vos descriptions la livraison rapide partout à Abidjan pour rassurer vos clients.\n3. **Partagez votre boutique** : Utilisez le bouton de partage story pour diffuser vos produits avec le visuel « Ce que j'achète » sur Snapchat, Instagram et WhatsApp !`;
    } else {
      dynamicReply = `Bonjour ! Je suis **Rust**, votre copilote IA pour la boutique **${storeName}**.\n\nVous avez actuellement **${products.length} produit(s)** en vente pour un chiffre d'affaires mensuel de **${monthlyRevenue.toLocaleString("fr-FR")} FCFA**.\n\nPosez-moi des questions sur vos revenus, vos stocks, ou demandez-moi des conseils personnalisés pour développer votre activité !`;
    }

    return NextResponse.json({ reply: dynamicReply });

  } catch (error: any) {
    console.error("Erreur serveur route Rust AI:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la communication avec l'assistant Rust." },
      { status: 500 }
    );
  }
}

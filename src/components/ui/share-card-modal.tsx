"use client";

import { formatXOF } from "@/lib/format";

export interface ShareCardProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  storeName?: string;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(img);
      fallback.src = "/images/app_icon.png";
    };
    img.src = src || "/images/app_icon.png";
  });
}

/**
 * Generates an ultra-clean share card image with:
 * - Blurred background
 * - Circle product photo
 * - "Ce que j'achète" title badge
 * - Product price in pure WHITE (#FFFFFF)
 * - W-COM branding
 */
export async function generateShareCardBlob(product: ShareCardProduct): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = await loadImage(product.imageUrl);

    // 1. Draw background blurred image
    ctx.save();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Dark frosted glass overlay
    ctx.fillStyle = "rgba(15, 17, 23, 0.82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Radial warm glow
    const radialGlow = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2 - 40,
      60,
      canvas.width / 2,
      canvas.height / 2,
      520
    );
    radialGlow.addColorStop(0, "rgba(255, 130, 0, 0.22)");
    radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 2. Header badge: "Ce que j'achète"
    const badgeY = 150;
    const badgeW = 430;
    const badgeH = 76;
    const badgeX = (canvas.width - badgeW) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(255, 130, 0, 0.45)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#FF8200";
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 38);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ CE QUE J'ACHÈTE ✨", canvas.width / 2, badgeY + badgeH / 2);
    ctx.restore();

    // 3. Center circle image with glowing border
    const circleX = canvas.width / 2;
    const circleY = 550;
    const radius = 225;

    // Glowing border ring
    ctx.save();
    ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();

    // Circle clip for product photo
    ctx.save();
    ctx.beginPath();
    ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const aspect = img.width / (img.height || 1);
    let drawW = radius * 2;
    let drawH = radius * 2;
    let drawX = circleX - radius;
    let drawY = circleY - radius;

    if (aspect > 1) {
      drawW = radius * 2 * aspect;
      drawX = circleX - drawW / 2;
    } else {
      drawH = (radius * 2) / aspect;
      drawY = circleY - drawH / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // 4. Product Name below circle
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 46px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 14;

    let displayTitle = product.name;
    if (displayTitle.length > 34) {
      displayTitle = displayTitle.substring(0, 32) + "...";
    }
    ctx.fillText(displayTitle, canvas.width / 2, 860);

    // Store name if present
    if (product.storeName) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "600 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`Chez ${product.storeName}`, canvas.width / 2, 910);
    }
    ctx.restore();

    // 5. Price badge below title - PRICE IN PURE WHITE (#FFFFFF)
    const priceY = 960;
    const priceText = formatXOF(product.price);
    ctx.save();
    ctx.font = "900 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const priceMetrics = ctx.measureText(priceText);
    const priceBoxW = priceMetrics.width + 80;
    const priceBoxH = 86;
    const priceBoxX = (canvas.width - priceBoxW) / 2;

    // Orange pill with glowing border
    ctx.shadowColor = "rgba(255, 130, 0, 0.4)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#FF8200";
    roundRect(ctx, priceBoxX, priceY, priceBoxW, priceBoxH, 26);
    ctx.fill();

    // Subtle white outline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // PURE WHITE PRICE TEXT
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 8;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(priceText, canvas.width / 2, priceY + priceBoxH / 2);
    ctx.restore();

    // 6. Footer: W-COM branding
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fillRect(160, 1150, canvas.width - 320, 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("W-COM", canvas.width / 2, 1205);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "500 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Le commerce connecté • www.w-com.app", canvas.width / 2, 1248);
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } catch (err) {
    console.error("Error generating share card blob:", err);
    return null;
  }
}

/**
 * Generates the share card and triggers WhatsApp intent directly (with no modal popup).
 * - Shares the image and product link via native share sheet or WhatsApp URL intent.
 * - Downloads the card automatically so the user also has it in their gallery.
 */
export async function shareProductToWhatsApp(product: ShareCardProduct): Promise<void> {
  if (typeof window === "undefined" || !product) return;

  try {
    const origin = window.location.origin;
    const productUrl = `${origin}/product/${product.id}`;
    const shareText = `Regardez ce que j'achète sur W-COM ! ✨\n\n🛍️ *${product.name}*\n💰 *Prix : ${formatXOF(product.price)}*\n\n👉 Découvrez ou commandez le produit ici :\n${productUrl}`;

    // 1. Generate image blob with white price in the background
    const blob = await generateShareCardBlob(product);

    if (blob) {
      const fileName = `ce-que-jachete-${product.id}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // 2. Mobile Native Share API: supports passing the image file directly to WhatsApp
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: `Ce que j'achète sur W-COM`,
            text: shareText,
            files: [file],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") return;
          console.warn("navigator.share fallback to WhatsApp URL:", shareErr);
        }
      }

      // 3. Fallback: Copy image to clipboard for easy paste (Ctrl+V) into WhatsApp
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof ClipboardItem !== "undefined"
      ) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        } catch (clipErr) {
          console.warn("Clipboard copy optional:", clipErr);
        }
      }

      // 4. Download generated card to device
      try {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `ce-que-jachete-${product.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 8000);
      } catch (dlErr) {
        console.warn("Card auto-download optional:", dlErr);
      }
    }

    // 5. Open WhatsApp directly with text and link
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error("Error sharing to WhatsApp:", err);
  }
}

/**
 * Backwards-compatibility no-op: popup window is completely removed.
 */
export function ShareCardModal(_props: any) {
  return null;
}

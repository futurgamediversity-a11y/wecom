"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Share2,
  Download,
  Check,
  Copy,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { formatXOF } from "@/lib/format";

export interface ShareCardProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  storeName?: string;
}

export function ShareCardModal({
  isOpen,
  onClose,
  product,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: ShareCardProduct | null;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);

  const productUrl =
    typeof window !== "undefined" && product
      ? `${window.location.origin}/product/${product.id}`
      : "";

  useEffect(() => {
    if (!isOpen || !product) {
      setDataUrl("");
      return;
    }

    setGenerating(true);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = product.imageUrl || "/images/app_icon.png";

    img.onload = () => {
      // 1. Draw background blurred image
      ctx.save();
      // Draw background image scaled to fill
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Dark frosted glass overlay
      ctx.fillStyle = "rgba(15, 17, 23, 0.78)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add soft orange / green radial glow
      const radialGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2 - 40,
        50,
        canvas.width / 2,
        canvas.height / 2,
        500
      );
      radialGlow.addColorStop(0, "rgba(255, 130, 0, 0.25)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2. Header badge: "Ce que j'achète"
      const badgeY = 160;
      ctx.save();
      ctx.shadowColor = "rgba(255, 130, 0, 0.4)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#FF8200";
      
      // Rounded pill for badge
      const badgeW = 420;
      const badgeH = 76;
      const badgeX = (canvas.width - badgeW) / 2;
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 38);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ CE QUE J'ACHÈTE ✨", canvas.width / 2, badgeY + badgeH / 2);
      ctx.restore();

      // 3. Center circle image with glowing border
      const circleX = canvas.width / 2;
      const circleY = 560;
      const radius = 230;

      // Glow ring
      ctx.save();
      ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(circleX, circleY, radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();

      // Circular crop image
      ctx.save();
      ctx.beginPath();
      ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Calculate crop to cover circle
      const aspect = img.width / img.height;
      let drawW = radius * 2;
      let drawH = radius * 2;
      let drawX = circleX - radius;
      let drawY = circleY - radius;

      if (aspect > 1) {
        drawW = (radius * 2) * aspect;
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
      ctx.font = "900 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 12;
      
      // Truncate name if too long
      let displayTitle = product.name;
      if (displayTitle.length > 36) {
        displayTitle = displayTitle.substring(0, 34) + "...";
      }
      ctx.fillText(displayTitle, canvas.width / 2, 880);

      // Store name if present
      if (product.storeName) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "600 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillText(`Chez ${product.storeName}`, canvas.width / 2, 930);
      }
      ctx.restore();

      // 5. Price badge below title
      const priceY = 980;
      const priceText = formatXOF(product.price);
      ctx.save();
      ctx.font = "900 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const priceMetrics = ctx.measureText(priceText);
      const priceBoxW = priceMetrics.width + 80;
      const priceBoxH = 84;
      const priceBoxX = (canvas.width - priceBoxW) / 2;

      ctx.fillStyle = "rgba(255, 130, 0, 0.15)";
      ctx.strokeStyle = "#FF8200";
      ctx.lineWidth = 4;
      roundRect(ctx, priceBoxX, priceY, priceBoxW, priceBoxH, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FF8200";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(priceText, canvas.width / 2, priceY + priceBoxH / 2);
      ctx.restore();

      // 6. Footer: W-COM branding
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(160, 1170, canvas.width - 320, 2);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("W-COM", canvas.width / 2, 1220);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "500 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("La marketplace ivoirienne • w-com.ci", canvas.width / 2, 1260);
      ctx.restore();

      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
      setGenerating(false);
    };

    img.onerror = () => {
      setGenerating(false);
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `ce-que-j-achete-${product.id}.png`;
    a.click();
  };

  const handleWhatsAppShare = () => {
    const text = `Regarde ce que j'achète sur W-COM ! ✨\n\n🛍️ *${product.name}*\n💰 Prix : *${formatXOF(product.price)}*\n\nDécouvre-le ici : ${productUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        if (dataUrl) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], "ce-que-j-achete.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Ce que j'achète sur W-COM : ${product.name}`,
              text: `Regarde ce que j'achète sur W-COM : ${product.name} pour ${formatXOF(product.price)} !`,
              url: productUrl,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({
          title: `Ce que j'achète sur W-COM : ${product.name}`,
          text: `Regarde ce que j'achète sur W-COM : ${product.name} pour ${formatXOF(product.price)} !`,
          url: productUrl,
        });
      } catch (err) {
        console.warn("Share sheet dismissed:", err);
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-wcom-orange/20 text-wcom-orange">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-lg font-black leading-tight">Article ajouté au panier !</h3>
            <p className="text-xs text-neutral-400">Partagez votre découverte avec vos proches</p>
          </div>
        </div>

        {/* Generated Card Preview */}
        <div className="relative flex-1 min-h-[260px] max-h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center p-2">
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-neutral-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-wcom-orange border-t-transparent" />
              <span className="text-xs">Génération du visuel...</span>
            </div>
          ) : dataUrl ? (
            <img
              src={dataUrl}
              alt="Carte de partage"
              className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <p className="text-xs text-neutral-400">Aperçu indisponible</p>
          )}
        </div>

        {/* Share buttons row */}
        <div className="mt-4 space-y-2.5 shrink-0">
          {/* WhatsApp Primary button */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition transform active:scale-95"
          >
            <span>Partager sur WhatsApp (avec lien)</span>
          </button>

          {/* Social network story actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 py-2.5 px-3 text-xs font-bold text-white shadow-md hover:opacity-90 transition active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span>Snap / Insta / Story</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 py-2.5 px-3 text-xs font-bold text-white border border-white/10 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Enregistrer l'image</span>
            </button>
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 py-2 text-xs font-medium text-neutral-300 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-wcom-green" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Lien copié !" : "Copier le lien"}</span>
            </button>

            <Link
              href="/checkout"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-wcom-orange hover:bg-orange-600 py-2 text-xs font-bold text-white transition text-center shadow-md"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Voir mon panier</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to draw rounded rectangle on HTML5 canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

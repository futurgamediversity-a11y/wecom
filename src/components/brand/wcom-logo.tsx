import { cn } from "@/lib/cn";

/**
 * The rotated, layered "W-COM" lockup from role_screen.dart:
 *   - white card with orange border
 *   - orange shadow behind
 *   - green shadow behind that
 *   - rotated -0.15 rad (~-8.6°)
 */
export function WComLogo({
  className,
  size = "lg",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm"
      ? { w: 140, h: 44, text: "text-xl" }
      : size === "md"
      ? { w: 200, h: 60, text: "text-3xl" }
      : { w: 260, h: 80, text: "text-4xl" };

  return (
    <div
      className={cn("relative inline-block select-none", className)}
      style={{ width: dims.w, height: dims.h, transform: "rotate(-8.6deg)" }}
    >
      <div
        className="absolute bg-wcom-green"
        style={{ width: dims.w, height: dims.h, top: 12, left: 8 }}
      />
      <div
        className="absolute bg-wcom-orange"
        style={{ width: dims.w, height: dims.h, top: 6, left: 4 }}
      />
      <div
        className="absolute flex items-center justify-center bg-white border-[3px] border-wcom-orange"
        style={{ width: dims.w, height: dims.h }}
      >
        <span className={cn("font-black tracking-widest text-black", dims.text)}>
          W-COM
        </span>
      </div>
    </div>
  );
}

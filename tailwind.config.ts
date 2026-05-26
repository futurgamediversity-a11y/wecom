import type { Config } from "tailwindcss";

/**
 * W-COM design tokens, ported from the Flutter app
 * (lib/screens/theme_manager.dart + login_screen.dart + role_screen.dart).
 *
 * The auth/buyer flow uses a light palette (off-white background, orange
 * primary CTA, green secondary). Selectable theme packs (default dark,
 * light_crisp, emerald_forest, neon_cyber) live behind data attributes.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        // Brand
        wcom: {
          orange: "#FF8200",   // primaryOrange
          green: "#009639",    // primaryGreen
          dark: "#121212",     // role_screen darkBackground
          ink: "#090A0F",      // default pack bg
          surface: "#1E202A",  // default pack cardBg
          offwhite: "#FAFAFA", // login_screen background
        },
        // Theme pack: light_crisp
        crisp: {
          bg: "#F9FAFB",
          card: "#FFFFFF",
          accent: "#2563EB",
          text: "#111827",
          muted: "#6B7280",
          border: "#E5E7EB",
        },
        // Theme pack: emerald_forest
        emerald_pack: {
          bg: "#064E3B",
          card: "#065F46",
          accent: "#FBBF24",
          text: "#FFFFFF",
          muted: "#D9FFFFFF",
        },
        // Theme pack: neon_cyber
        neon: {
          bg: "#000000",
          card: "#111111",
          accent: "#D946EF",
          text: "#FFFFFF",
          muted: "#AAA9AD",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",   // matches login button radius
        md: "8px",
        lg: "16px",  // matches login card radius
        xl: "24px",  // matches modern card radius
      },
      boxShadow: {
        card: "0 10px 20px rgba(0,0,0,0.02)",
        glow: "0 0 30px rgba(255,130,0,0.35)",
      },
      backgroundImage: {
        "dot-grid":
          "radial-gradient(circle, rgba(0,150,57,0.15) 1.5px, transparent 1.5px)",
        "dot-grid-orange":
          "radial-gradient(circle, rgba(255,130,0,0.15) 1.5px, transparent 1.5px)",
      },
      backgroundSize: {
        "dot-35": "35px 35px",
      },
    },
  },
  plugins: [],
};
export default config;

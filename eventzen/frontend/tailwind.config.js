/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E1",
        butter: "#F5E6C8",
        amber: "#D4A843",
        "amber-dark": "#8B6914",
        burgundy: "#7A1B2D",
        "burgundy-dark": "#5A1220",
        rose: "#E85B8A",
        sage: "#8BA888",
        indigo: "#3730A3",
        lime: "#C5D23E",
        terracotta: "#A0522D",
        blush: "#E8B4B8",
        "dusty-blue": "#7B9EB8",
        "warm-brown": "#8B6914",
        "warm-tan": "#D4C5A9",
        "border-light": "#E8E0D0",
        "near-black": "#1E1E1E",
        "dark-gray": "#4A4A4A",
        "muted-gray": "#8A8A8A",
        forest: "#2D3B2D",
      },
      fontFamily: {
        heading: ["'Playfair Display'", "'Libre Baskerville'", "Georgia", "serif"],
        body: ["'DM Sans'", "'Source Sans 3'", "system-ui", "sans-serif"],
        accent: ["'Outfit'", "'DM Sans'", "sans-serif"],
        display: ["'Cormorant Garamond'", "'Playfair Display'", "serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      boxShadow: {
        "card-hover": "0 12px 32px rgba(0, 0, 0, 0.08)",
        card: "0 4px 12px rgba(0, 0, 0, 0.04)",
        "warm-sm": "0 2px 8px rgba(0, 0, 0, 0.04)",
        "warm-md": "0 4px 16px rgba(0, 0, 0, 0.06)",
        "warm-lg": "0 8px 24px rgba(0, 0, 0, 0.08)",
        "warm-xl": "0 12px 32px rgba(0, 0, 0, 0.1)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "marquee-slow": "marquee 45s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        "count-up": "count-up 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

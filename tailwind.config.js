/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f4f5f3",
        card: "#ffffff",
        primary: {
          DEFAULT: "#22c55e",
          foreground: "#052e16",
        },
        secondary: "#eef2ef",
        accent: "#e7f8ec",
        "accent-foreground": "#166534",
        success: "#16a34a",
        destructive: "#dc2626",
        muted: "#6b7280",
        sidebar: "#12231a",
        "sidebar-accent": "#1c3327",
        border: "#e5e7eb",
        input: "#f1f2f0",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      animation: {
        "gradient-shift": "gradient-shift 3s ease infinite",
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
      },
    },
    plugins: [],
  },
};

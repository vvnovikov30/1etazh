import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        text: "var(--color-text)",
        bg: "var(--color-bg)",
        "bg-light": "var(--color-bg-light)",
        border: "var(--color-border)",

        // Semantic aliases for design tokens
        surface: "var(--color-surface)",
        muted: "var(--color-muted)",
        brand: "var(--color-primary)",
        onBrand: "var(--color-on-primary)",
        accent: "var(--color-secondary)",
        link: "var(--color-link)",
        linkHover: "var(--color-link-hover)",
        success: "var(--color-success)",
        warn: "var(--color-warn)",
        danger: "var(--color-danger)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        btn: "var(--radius-btn)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

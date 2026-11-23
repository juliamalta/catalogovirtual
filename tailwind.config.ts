import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Baloo Paaji 2", "sans-serif"],
        marketing: ["DM Sans", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "rgb(var(--color-brand) / <alpha-value>)",
          dark: "rgb(var(--color-brand-dark) / <alpha-value>)",
          hover: "rgb(var(--color-brand-hover) / <alpha-value>)",
          soft: "rgb(var(--color-brand-soft) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          secondary: "rgb(var(--color-muted) / <alpha-value>)",
          "secondary-strong": "rgb(var(--color-muted-strong) / <alpha-value>)",
        },
        canvas: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-border) / <alpha-value>)",
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          soft: "rgb(var(--color-success-soft) / <alpha-value>)",
          border: "rgb(var(--color-success-border) / <alpha-value>)",
        },
        error: {
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
          soft: "rgb(var(--color-error-soft) / <alpha-value>)",
          border: "rgb(var(--color-error-border) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          soft: "rgb(var(--color-warning-soft) / <alpha-value>)",
          border: "rgb(var(--color-warning-border) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          soft: "rgb(var(--color-info-soft) / <alpha-value>)",
          border: "rgb(var(--color-info-border) / <alpha-value>)",
        },
      },
      boxShadow: {
        soft: "0 20px 60px rgb(var(--color-ink) / .09)",
        wizard: "0 18px 50px rgb(var(--color-ink) / .06)",
        card: "0 8px 24px rgb(var(--color-ink) / .07)",
        brand: "0 6px 16px rgb(var(--color-brand) / .2)",
        preview: "0 28px 80px -36px rgb(var(--color-ink) / .3)",
        pricing: "0 20px 70px -45px rgb(var(--color-ink) / .3)",
        showcase: "0 24px 70px -38px rgb(var(--color-ink) / .35)",
      },
    },
  },
  plugins: [],
};

export default config;

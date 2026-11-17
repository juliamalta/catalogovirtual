import type { Config } from "tailwindcss";
const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { fontFamily: { sans: ["Baloo Paaji 2", "sans-serif"] }, colors: { vitrix: { 50: "#f5f2ff", 100: "#eee8ff", 500: "#7956e8", 600: "#6942d7", 700: "#5832c3" } }, boxShadow: { soft: "0 20px 60px rgba(37, 24, 78, .09)" } } }, plugins: [] };
export default config;

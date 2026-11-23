import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { background: "hsl(var(--background))", foreground: "hsl(var(--foreground))", primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" }, "muted-foreground": "hsl(var(--muted-foreground))", ring: "hsl(var(--ring))" }, borderRadius: { lg: "var(--radius)" } } },
  plugins: [],
} satisfies Config;

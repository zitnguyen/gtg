/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        md: "1.5rem",
        lg: "2rem",
      },
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        "z-bg": "var(--z-bg)",
        "z-s1": "var(--z-s1)",
        "z-s2": "var(--z-s2)",
        "z-s3": "var(--z-s3)",
        "z-gold": "var(--z-gold)",
        "z-teal": "var(--z-teal)",
        "z-purple": "var(--z-purple)",
        "z-green": "var(--z-green)",
        "z-red": "var(--z-red)",
        "z-t1": "var(--z-t1)",
        "z-t2": "var(--z-t2)",
        "z-t3": "var(--z-t3)",
        "z-t4": "var(--z-t4)",
        "z-accent": "var(--z-accent)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["Sora", "system-ui", "sans-serif"],
        sora: ["Sora", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
        display: ["Sora", "system-ui", "sans-serif"],
      },
      borderRadius: {
        chess: "8px",
        card: "14px",
        lg2: "20px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        elevated:
          "0 1px 2px 0 rgba(0, 0, 0, 0.24), 0 8px 24px -8px rgba(0, 0, 0, 0.45)",
        glow: "0 0 24px -4px var(--z-accent)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")({ nocompatible: true })],
};

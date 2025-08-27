/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",       // App Router của Next.js
    "./src/components/**/*.{js,ts,jsx,tsx}", // Component của bạn
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  darkMode: "class", // quan trọng nếu bạn dùng .dark
  plugins: [],
}

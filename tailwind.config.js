/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./web/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        accent: "var(--accent-color)",
        "accent-hover": "var(--accent-hover)",
        border: "var(--border-color)",
        error: "var(--error-color)",
        success: "var(--success-color)",
        card: "var(--card-bg)",
      },
      backgroundColor: {
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
        card: "var(--card-bg)",
        header: "var(--header-bg)",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
      },
      borderColor: {
        DEFAULT: "var(--border-color)",
      },
      keyframes: {
        modalFadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        modalSlideUp: {
          from: { transform: "translateY(24px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        modalFadeIn: "modalFadeIn 0.2s ease",
        modalSlideUp: "modalSlideUp 0.25s ease",
      },
    },
  },
  plugins: [],
}

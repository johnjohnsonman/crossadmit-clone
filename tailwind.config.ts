import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ritual-tea 스타일의 차분한 파스텔 톤
        background: "var(--background)",
        foreground: "var(--foreground)",
        tea: {
          50: "#f5f7f4",
          100: "#e8ede4",
          200: "#d4ddcc",
          300: "#b5c5a8",
          400: "#92a77f",
          500: "#74895d",
          600: "#5a6b48",
          700: "#47553a",
          800: "#3a4531",
          900: "#323a2a",
        },
        sage: {
          50: "#f6f7f6",
          100: "#e3e7e3",
          200: "#c7d0c7",
          300: "#a3b0a3",
          400: "#7d8d7d",
          500: "#627162",
          600: "#4d5a4d",
          700: "#404a40",
          800: "#363e36",
          900: "#2f352f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;



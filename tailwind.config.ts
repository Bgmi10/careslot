import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#14262B", paper: "#F4F8F7", brand: { DEFAULT: "#0E7C66", dark: "#0A5C4C", soft: "#DCEFE9" }, alert: "#C2410C" },
      fontFamily: { sans: ["var(--font-main)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;

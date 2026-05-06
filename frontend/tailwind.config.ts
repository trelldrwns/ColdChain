import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        muted: "var(--bg-muted)",
        sidebar: {
          bg: "var(--sidebar-bg)",
          active: "var(--sidebar-active)",
          text: "var(--sidebar-text)",
          icon: "var(--sidebar-icon)"
        },
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          dark: "var(--accent-dark)"
        },
        ok: { DEFAULT: "var(--ok)", light: "var(--ok-light)" },
        warn: { DEFAULT: "var(--warn)", light: "var(--warn-light)" },
        danger: { DEFAULT: "var(--danger)", light: "var(--danger-light)" },
        info: { DEFAULT: "var(--info)", light: "var(--info-light)" },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        }
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)"
      },
      boxShadow: {
        card: "var(--shadow-card)",
        panel: "var(--shadow-panel)",
        float: "var(--shadow-float)",
      },
      fontFamily: {
        ui: ["var(--font-ui)", "sans-serif"],
        data: ["var(--font-data)", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;

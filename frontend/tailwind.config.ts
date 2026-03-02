import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Sprint Titanium (Apple Inspiration)
                apple: {
                    bgLight: "#F5F5F7",
                    textDark: "#1D1D1F",
                    secondary: "#86868B",
                },
                spaceGray: {
                    light: "#808080",
                    DEFAULT: "#4B4B4C",
                },
                titanium: {
                    light: "#E8E8E8",
                    DEFAULT: "#C6C6C6",
                    dark: "#AFAFAF",
                },
                // Legacy / Compatibility
                primary: "#2463eb",
                gold: {
                    light: "#F3E5AB",
                    DEFAULT: "#D4AF37",
                    dark: "#996515",
                },
                "background-light": "#f8f9fc",
                "background-dark": "#000000",
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            fontFamily: {
                sans: ["Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
                display: ["Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
            },
            borderRadius: {
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
            boxShadow: {
                "glass-light": "0 8px 32px rgba(0,0,0,0.06)",
                "glass-dark": "0 8px 32px rgba(0,0,0,0.3)",
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};

export default config;

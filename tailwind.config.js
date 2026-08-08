/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fairway: {
          50: "#f1f7f3",
          100: "#dcece1",
          500: "#2f7653",
          700: "#1d533a",
          800: "#17442f",
          900: "#123d2a",
          950: "#09251a",
        },
        trophy: {
          100: "#f8efd3",
          400: "#d6b55f",
          500: "#bd9335",
          700: "#7f5e1f",
        },
        canvas: "#f5f3ec",
        ink: "#17231c",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 12px 30px -20px rgba(9, 37, 26, 0.45)",
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

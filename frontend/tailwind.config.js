/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#87AFE0",
          dark: "#6b9bc9",
        },
        gradient: {
          start: "#87AFE0",
          end: "#F2F3B3",
        },
        accent: "#308E10",
        "text-main": "#333333",
      },
      backgroundImage: {
        "gradient-main": "linear-gradient(90deg, #87AFE0 0%, #F2F3B3 100%)",
      },
    },
  },
  plugins: [],
};

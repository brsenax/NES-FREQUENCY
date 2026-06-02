/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Isso cobre todos os seus componentes React
  ],
  theme: {
    extend: {
      colors: {
        // Você pode adicionar as cores do seu projeto aqui
        primary: '#1e40af', 
      }
    },
  },
  plugins: [],
}
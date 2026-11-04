/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#FDF2F4',
          100: '#FBE5E8',
          200: '#F7CCD3',
          300: '#F0A3AF',
          400: '#E56D81',
          500: '#D53D58',
          600: '#B8233E',
          700: '#94162D',
          800: '#7E1529',
          900: '#5C0F1E',
          950: '#3D0510',
        },
        gold: {
          50: '#FDFBF2',
          100: '#FAF4DE',
          200: '#F4E7BD',
          300: '#EBD594',
          400: '#DFC068',
          500: '#D4AF37', // Royal Nizami Gold
          600: '#B89025',
          700: '#916D1C',
          800: '#75551B',
          900: '#63471A',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F5ECE0',
          300: '#EDE0CC',
          400: '#E2CEB2',
          500: '#D4BA94',
        },
        charcoal: {
          800: '#2A2526',
          900: '#1A1819',
          950: '#121111',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}

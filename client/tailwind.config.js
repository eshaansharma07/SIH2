/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F4EFE6',
          300: '#ECE4D4',
          400: '#DFD3BE',
          500: '#C8B79B',
        },
        terracotta: {
          50: '#FDF5F0',
          100: '#F9E7DE',
          200: '#F3CEBD',
          300: '#EAAD93',
          400: '#DE8361',
          500: '#C15324', // Primary Indian village terracotta
          600: '#A74218',
          700: '#8A3412',
          800: '#6F2B12',
          900: '#4D1D0C',
        },
        ochre: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F59E0B',
          500: '#D97706', // Warm turmeric / marigold
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
        },
        indigoRural: {
          50: '#F1F5F9',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#334A77',
          600: '#233354',
          700: '#1A2742',
          800: '#141E33',
          900: '#0C1322', // Deep handloom indigo
        },
        forestRural: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#276749', // Muted forest harvest green
          600: '#1E523A',
          700: '#163E2C',
          800: '#102F21',
        }
      },
      fontFamily: {
        sans: ['"Nunito"', '"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Rozha One"', '"Cinzel"', 'serif'],
      },
      boxShadow: {
        'paper': '0 2px 10px -2px rgba(120, 53, 15, 0.06), 0 1px 4px -1px rgba(120, 53, 15, 0.04)',
        'paper-lg': '0 10px 25px -4px rgba(120, 53, 15, 0.08), 0 4px 10px -2px rgba(120, 53, 15, 0.04)',
        'paper-hover': '0 14px 28px -5px rgba(120, 53, 15, 0.12), 0 6px 12px -3px rgba(120, 53, 15, 0.06)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}

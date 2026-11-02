/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        card: c('card'),
        ink: c('ink'),
        muted: c('muted'),
        line: c('line'),
        soft: c('soft'),
        pb: c('pb'), // pastel blue  #A9C9F5
        pbSoft: c('pb-soft'), // light blue   #F0F6FF
        pbInk: c('pb-ink'), // readable blue for text
        pr: c('pr'), // pastel red   #F4A6A6
        prSoft: c('pr-soft'), // light red    #FFF1F1
        prInk: c('pr-ink'), // readable red for text
        navy: '#26344A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(38,52,74,0.04)',
        pop: '0 10px 30px rgba(38,52,74,0.10)',
      },
      keyframes: {
        slide: { from: { transform: 'translateX(28px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        rise: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'none', opacity: 1 } },
      },
      animation: {
        slide: 'slide .24s ease-out',
        fade: 'fade .2s ease-out',
        rise: 'rise .25s ease-out',
      },
    },
  },
  plugins: [],
}

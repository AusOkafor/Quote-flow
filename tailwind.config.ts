import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        ink:     '#0D0D0D',
        paper:   '#F5F2EC',
        cream:   '#EDE9DF',
        border:  '#D8D3C8',
        muted:   '#8A8278',
        accent:  '#E85C2F',
        accent2: '#2F7DE8',
        success: '#2DAB6F',
        gold:    '#C9A84C',
        danger:  '#E84040',
      },
    },
  },
  plugins: [],
} satisfies Config

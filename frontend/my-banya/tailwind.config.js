
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        brown_primary: {
          light: '#A0673A',
          middle: '#A0673A',
          dark: '#884517'
        },
        green_primary: {
          light: '#A0673A',
          middle: '#38700B',
          dark: '#884517'
        }
      },
      width:
      {
        '640': '640px'
      },
      height:
      {
        '600': '600px'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      }
    },
  },
  plugins: [],
}
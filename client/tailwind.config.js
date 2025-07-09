/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: '#445466',
        darkBlue: '#001122',
        textGray: '#AFBECC',
        yellow: '#BF7E1C',
        background:"#171922",
        pink:'#8469B9',
        grayDash:"#222430",
        gray2:"#475366",
        gray3:"#20222F",
        white:"#EFEBF6",
        black:"#171922",
        gray4:"#353847",
        pink2:"#7658B1",
        white2:"#777C9D",
        selectGray1:"#C6C8D6",
        selectGreen1:"#0EC359",
        selectPurple1:"#B296F5",
        selectRed1:"#DC5091",
        selectBlack2:"#2E3142",
        selectGreen2:"#064B23",
        selectPurple2:"#11042F",
        selectRed2:"#801949"
      },
      fontFamily:{
        radioCanada:"Radio Canada"
      },
    },
  },
  plugins: [],
}

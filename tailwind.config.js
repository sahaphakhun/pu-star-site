module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#223f81',
        accent: '#f39921',
        'mobile-touch': '#4F46E5', // เพิ่มสีสำหรับ touch interactions
      },
      spacing: {
        'touch': '44px', // minimum touch target size
        '18': '4.5rem',
        '88': '22rem',
      },
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      borderRadius: {
        'mobile': '0.75rem', // 12px - optimal for mobile touch
        'mobile-lg': '1rem',  // 16px
      },
      boxShadow: {
        'mobile': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      screens: {
        'xs': '475px',      // เพิ่ม breakpoint สำหรับมือถือขนาดเล็ก
        'sm': '640px',      // mobile landscape / tablet portrait
        'md': '768px',      // tablet landscape
        'lg': '1024px',     // desktop
        'xl': '1280px',     // large desktop
        '2xl': '1536px',    // extra large desktop
        // Touch-specific breakpoints
        'touch': {'raw': '(hover: none)'},  // devices without hover
        'pointer-coarse': {'raw': '(pointer: coarse)'}, // touch devices
      },
      animation: {
        'mobile-bounce': 'mobile-bounce 1s infinite',
        'mobile-pulse': 'mobile-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mobile-fade-in': 'mobile-fade-in 0.3s ease-out',
      },
      keyframes: {
        'mobile-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'mobile-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
        'mobile-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '250': '250ms', // สำหรับ touch feedback ที่รวดเร็ว
      },
    },
  },
  plugins: [
    // เพิ่ม utilities สำหรับ mobile-first design
    function({ addUtilities, theme }) {
      const mobileUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.tap-highlight-none': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.scrollbar-none': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
      };

      addUtilities(mobileUtilities);
    },
  ],
}; 
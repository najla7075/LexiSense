/**
 * LexiSense - Tailwind CSS Configuration System
 */
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#FAF5FF',
                    100: '#F3E8FF',
                    200: '#E9D5FF',
                    300: '#D8B4FE',
                    400: '#C084FC',
                    500: '#A855F7',
                    600: '#9333EA',
                    700: '#7E22CE',
                    800: '#6B21A8',
                    900: '#581C87',
                    950: '#3B0764',
                    // Semantic Aliases
                    purple: '#7C3AED',
                    'purple-dark': '#6D28D9',
                    'purple-bright': '#9333EA',
                    'purple-light': '#C084FC',
                    'purple-soft': '#F3E8FF',
                    'purple-deep': '#3B0764',
                    yellow: '#F59E0B',
                    'yellow-sun': '#FBBF24',
                    'yellow-light': '#FEF3C7',
                    cream: '#FAF8F5',
                    mint: '#10B981',
                    coral: '#FB7185',
                    sky: '#38BDF8',
                },
                amber: {
                    450: '#F59E0B',
                    550: '#D97706'
                },
                surface: '#FAF8F5'
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                heading: ['"Baloo 2"', 'cursive', 'sans-serif'],
                dyslexic: ['"Lexend"', '"OpenDyslexic"', 'system-ui', 'sans-serif'],
                body: ['"Nunito"', '"Plus Jakarta Sans"', 'sans-serif']
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(126, 34, 206, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
                'card': '0 8px 24px -4px rgba(59, 7, 100, 0.04), 0 1px 2px rgba(0,0,0,0.02)',
                'glow': '0 10px 25px -3px rgba(126, 34, 206, 0.25)',
                'modal': '0 25px 50px -12px rgba(59, 7, 100, 0.25)'
            },
            animation: {
                'float-slow': 'floatLetter3D 6s ease-in-out infinite',
                'pulse-glow': 'auraPulse 3.5s ease-in-out infinite',
                'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                'bounce-subtle': 'bounceSoft 2.5s ease-in-out infinite',
                'wiggle': 'wiggle 2s ease-in-out infinite',
                'cloud-drift': 'cloudFloat 18s linear infinite',
            },
            keyframes: {
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
                bounceSoft: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' }
                },
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' }
                },
                cloudFloat: {
                    '0%': { transform: 'translateX(-10%)' },
                    '50%': { transform: 'translateX(10%)' },
                    '100%': { transform: 'translateX(-10%)' }
                }
            }
        }
    }
};

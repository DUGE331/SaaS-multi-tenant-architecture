/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}', './config/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg-app)',
        surface: 'var(--color-bg-surface)',
        subtle: 'var(--color-bg-subtle)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        foreground: 'var(--color-text-primary)',
        muted: 'var(--color-text-muted)',
        'muted-foreground': 'var(--color-text-secondary)',
        primary: {
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        accent: {
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        auth: '30rem',
        app: '80rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

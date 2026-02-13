/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          900: '#000000',
          800: '#0A0A0A',
          700: '#111111',
          600: '#18181B'
        },
        ui: {
          DEFAULT: '#0A0A0A',
          muted: '#A1A1AA'
        },
        accent: {
          DEFAULT: '#0070F3'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace']
      },
      backgroundColor: theme => ({
        ...theme('colors'),
        page: '#000000'
      }),
      typography: {
        DEFAULT: {
          css: {
            color: '#e5e7eb',
            maxWidth: 'none',
            lineHeight: '1.7',
            a: {
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: '500',
              '&:hover': {
                color: '#93c5fd',
                textDecoration: 'underline',
              },
            },
            h1: {
              color: '#f9fafb',
              fontWeight: '700',
              fontSize: '2em',
              marginTop: '1.5em',
              marginBottom: '0.75em',
              borderBottom: '1px solid #374151',
              paddingBottom: '0.5em',
            },
            h2: {
              color: '#f9fafb',
              fontWeight: '600',
              fontSize: '1.6em',
              marginTop: '1.5em',
              marginBottom: '0.75em',
            },
            h3: {
              color: '#f9fafb',
              fontWeight: '600',
              fontSize: '1.3em',
              marginTop: '1.25em',
              marginBottom: '0.5em',
            },
            h4: {
              color: '#f9fafb',
              fontWeight: '600',
              marginTop: '1em',
              marginBottom: '0.5em',
            },
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            code: {
              color: '#fbbf24',
              backgroundColor: '#1f2937',
              padding: '0.15em 0.4em',
              borderRadius: '0.25em',
              fontWeight: '500',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1f2937',
              color: '#e5e7eb',
              borderRadius: '0.5em',
              padding: '1em',
              overflowX: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'inherit',
              fontSize: 'inherit',
            },
            blockquote: {
              color: '#9ca3af',
              borderLeftColor: '#4b5563',
              borderLeftWidth: '4px',
              fontStyle: 'italic',
              paddingLeft: '1em',
              marginTop: '1em',
              marginBottom: '1em',
            },
            strong: {
              color: '#f9fafb',
              fontWeight: '600',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5em',
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            ol: {
              listStyleType: 'decimal',
              paddingLeft: '1.5em',
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1em',
              marginBottom: '1em',
            },
            thead: {
              color: '#f9fafb',
              borderBottomColor: '#4b5563',
              borderBottomWidth: '2px',
            },
            'thead th': {
              padding: '0.75em',
              textAlign: 'left',
              fontWeight: '600',
            },
            tbody: {
              tr: {
                borderBottomColor: '#374151',
                borderBottomWidth: '1px',
              },
            },
            'tbody td': {
              padding: '0.75em',
            },
            hr: {
              borderColor: '#374151',
              marginTop: '2em',
              marginBottom: '2em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

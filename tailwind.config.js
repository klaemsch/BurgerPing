module.exports = {
    content: [
      './src/**/*.svelte',
      './src/**/*.html',
      './public/index.html',
    ],
    theme: {
      fontFamily: {
        'sans': [
          '"Inter"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ]
      },
      extend: {
        colors: {
          svelte: '#ff3e00',
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  }
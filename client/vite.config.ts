// {{change 1}}
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Import tailwindcss and autoprefixer
// {{change 2}}
import autoprefixer from 'autoprefixer';
// Import postcss-import
import postcssImport from 'postcss-import';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        // Explicitly add postcss-import and configure it to ignore the tailwindcss import
        postcssImport({
            filter: (url) => !url.startsWith('tailwindcss'),
        }),
        // Place tailwindcss AFTER postcss-import so postcss-import runs first
        // but ignores the tailwindcss rule, leaving it for the tailwindcss plugin.
        // {{change 3}}
        autoprefixer(),
      ],
    },
  },
})
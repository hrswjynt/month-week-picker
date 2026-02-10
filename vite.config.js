import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        // CSS is handled by Tailwind, component styles go inline
        css: 'injected',
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/content.js'),
      name: 'NonStandardInput',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'content.css';
          return assetInfo.name;
        },
      },
    },
  },
});

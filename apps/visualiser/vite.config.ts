import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  server: {
       watch: {
         usePolling: true, // Enable polling for file changes
       },
  },
  plugins: [
    checker({ typescript: true }),
    eslint()
  ]
});
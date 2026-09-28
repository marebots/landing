// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output for Cloudflare Pages; API lives in /functions
export default defineConfig({
  site: 'https://marebots.com',
  vite: {
    plugins: [tailwindcss()],
  },
});

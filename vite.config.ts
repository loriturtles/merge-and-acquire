import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves the game from /merge-and-acquire/; the iOS app and dev server use the root.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})

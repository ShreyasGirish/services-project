import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'services-project' with your EXACT GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/services-project/', 
})
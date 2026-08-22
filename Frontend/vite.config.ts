import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cars': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/loan-applications': 'http://localhost:3000',
      '/new-car-leads': 'http://localhost:3000',
      '/service-bookings': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/parse': 'http://localhost:3000',
    }
  }
})

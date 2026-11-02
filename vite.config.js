import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — always needed, load first
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // UI utilities loaded on most pages
          'vendor-ui': ['react-hot-toast', 'lucide-react'],

          // Charting library — only used on Dashboard; split so other routes don't pay the cost
          'vendor-recharts': ['recharts'],

          // PDF generation — only used when user downloads a receipt or report
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],

          // Excel export — only used in Reports page
          'vendor-xlsx': ['xlsx'],

          // HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
  },
});

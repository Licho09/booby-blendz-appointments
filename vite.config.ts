import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/booby-blendz-appointments/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

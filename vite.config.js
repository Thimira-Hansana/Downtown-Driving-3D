import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    base: '/Open-City-Driver-3D/',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    three: ['three', '@react-three/fiber', '@react-three/drei'],
                },
            },
        },
    },
    plugins: [react()],
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from "vite-plugin-checker";

export default defineConfig({
    plugins: [
        react({ jsxRuntime: "automatic" }),
        checker({ typescript: { tsconfigPath: "./tsconfig.json" } }),
    ],
    server: { port: 5173 }
})

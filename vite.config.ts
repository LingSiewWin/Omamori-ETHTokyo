import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.USDC_ADDRESS': JSON.stringify(process.env.USDC_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
    'process.env.JPYC_ADDRESS': JSON.stringify(process.env.JPYC_ADDRESS || '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c'),
    'process.env.POLYGON_ZKEVM_RPC_URL': JSON.stringify(process.env.POLYGON_ZKEVM_RPC_URL || 'https://rpc.polygon-zkevm-testnet.gelato.digital'),
    'process.env.VAULT_ADDRESS': JSON.stringify(process.env.VAULT_ADDRESS || ''),
    'process.env.NFT_ADDRESS': JSON.stringify(process.env.NFT_ADDRESS || ''),
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Use React-specific TypeScript config
  configFile: false,
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        allowJs: false,
        skipLibCheck: true,
        esModuleInterop: false,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        module: "ESNext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx"
      }
    }
  }
})
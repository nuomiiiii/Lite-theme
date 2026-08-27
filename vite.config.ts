import react from "@vitejs/plugin-react-swc"
import { execSync } from "node:child_process"
import * as fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import type { UserConfig } from "vite"
import dotenv from "dotenv"

const getGitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    return "dev"
  }
}

const projectRoot = fileURLToPath(new URL(".", import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const baseConfig: UserConfig = {
    base: "/",
    define: {
      "import.meta.env.VITE_GIT_HASH": JSON.stringify(getGitHash()),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "src"),
        react: path.resolve(projectRoot, "node_modules/react"),
        "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
      },
      dedupe: ["react", "react-dom"],
    },

    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
        },
      },
      chunkSizeWarningLimit: 1500,
    },
  }


  if (mode === "development") {
    const envPath = path.resolve(process.cwd(), ".env.development")
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath))
      for (const k in envConfig) {
        process.env[k] = envConfig[k]
      }
    }
    if (!process.env.VITE_API_TARGET) {
      process.env.VITE_API_TARGET = "http://127.0.0.1:27777"
    }
    baseConfig.server = {
      host: "127.0.0.1",
      port: 5373,
      strictPort: true,
      watch: {
        ignored: ["**/release/**"],
      },
      proxy: {
        "/api": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
          ws: true,
          rewriteWsOrigin: true,
        },
        "/favicon.ico": {
          target: process.env.VITE_API_TARGET,
          changeOrigin: true,
        },
      },
    }
  }
  return baseConfig
})

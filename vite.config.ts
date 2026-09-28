import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { openaiPlugin } from './server/openai.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), openaiPlugin(env.OPENAI_API_KEY ?? '')],
  }
})

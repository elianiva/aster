import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { think } from '@cloudflare/think/vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Cloudflare plugin sets `resolve.builtins` for the `ssr` environment only,
// but TanStack Start's `createServerFn` files are processed by both client and
// SSR environments. The client import-analysis plugin fails to resolve
// `cloudflare:workers`. This stub returns an empty module in non-SSR contexts.
function cloudflareClientStub(): Plugin {
  const stubId = '\0cloudflare-client-stub'
  return {
    name: 'cloudflare-client-stub',
    enforce: 'pre',
    resolveId(source, _importer, opts) {
      if (source !== 'cloudflare:workers') return
      if (opts.ssr || this.environment?.name === 'ssr') return
      return stubId
    },
    load(id) {
      if (id !== stubId) return
      return 'export const env = new Proxy({}, { get() { throw new Error("cloudflare:workers is server-only") } })'
    },
  }
}

const config = defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflareClientStub(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    viteReact(),
    devtools(),
    tailwindcss(),
    think({ routePrefix: '/api/agents', allowNonVirtualMain: true }),
  ],
})

export default config

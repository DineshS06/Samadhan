import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { findRenderer } from './src/lib/md/registry'
import { markdownHeaders } from './src/lib/md/http'

function markdownPlugin() {
  return {
    name: 'markdown-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        // Serve .md suffix requests (e.g. /faq.md -> markdown for /faq)
        if (url.endsWith('.md')) {
          const routePath = url.replace(/\.md$/, '') || '/'
          const renderer = findRenderer(routePath)
          if (!renderer) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end('Markdown not found for ' + routePath)
            return
          }
          const content = renderer() || ''
          const headers = markdownHeaders(routePath, Buffer.byteLength(content))
          res.writeHead(200, headers)
          res.end(content)
          return
        }

        // Accept: text/markdown negotiation on HTML routes
        const accept = req.headers.accept || ''
        if (accept.includes('text/markdown')) {
          const routePath = url === '/' ? '/' : url.replace(/\/$/, '') || '/'
          const renderer = findRenderer(routePath)
          if (renderer) {
            const content = renderer() || ''
            const headers = markdownHeaders(routePath, Buffer.byteLength(content))
            res.writeHead(200, headers)
            res.end(content)
            return
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), markdownPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})

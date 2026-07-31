import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Absolute path to the local iONMirror-Mocks repository directory
const MOCKS_DIR = path.resolve(__dirname, '../iONMirror-Mocks')

function localMocksPlugin() {
  return {
    name: 'local-mocks-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // API endpoint: return list of mock files from local ../iONMirror-Mocks directory
        if (req.url === '/dev-local-mocks' || req.url.startsWith('/dev-local-mocks?')) {
          try {
            if (!fs.existsSync(MOCKS_DIR)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Directory not found: ${MOCKS_DIR}` }))
              return
            }

            const files = fs.readdirSync(MOCKS_DIR)
            const mockFiles = files
              .filter(f => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('.'))
              .map(file => ({
                name: file,
                download_url: `/local-mocks/${encodeURIComponent(file)}`
              }))

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(mockFiles))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        // Endpoint to serve raw markdown file content or assets from local ../iONMirror-Mocks directory
        if (req.url.startsWith('/local-mocks/')) {
          try {
            const relativePath = decodeURIComponent(req.url.replace('/local-mocks/', '').split('?')[0])
            const filePath = path.join(MOCKS_DIR, relativePath)

            if (!filePath.startsWith(MOCKS_DIR) || !fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end('File not found')
              return
            }

            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
              res.statusCode = 403
              res.end('Directory access forbidden')
              return
            }

            const ext = path.extname(filePath).toLowerCase()
            let contentType = 'text/plain'
            if (ext === '.md') contentType = 'text/markdown; charset=utf-8'
            else if (ext === '.png') contentType = 'image/png'
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
            else if (ext === '.svg') contentType = 'image/svg+xml'

            res.setHeader('Content-Type', contentType)
            const content = fs.readFileSync(filePath)
            res.end(content)
          } catch (err) {
            res.statusCode = 500
            res.end(err.message)
          }
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localMocksPlugin()],
})


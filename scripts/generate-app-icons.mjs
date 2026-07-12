#!/usr/bin/env node
/**
 * App-Icons für Behördenpost (SVG → PNG).
 *
 *   npm run generate:app-icons
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const SIZES = [180, 192, 512]
const ICON_VERSION = 'behoerdenpost-1'

function iconSvg(size) {
  const fontSize = Math.round(size * 0.42)
  const envelopeWidth = Math.round(size * 0.46)
  const envelopeHeight = Math.round(size * 0.28)

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#1e3a5f"/>
  <rect x="${Math.round((size - envelopeWidth) / 2)}" y="${Math.round(size * 0.24)}" width="${envelopeWidth}" height="${envelopeHeight}" rx="${Math.round(size * 0.03)}" fill="#ffffff" opacity="0.95"/>
  <path d="M${Math.round((size - envelopeWidth) / 2)} ${Math.round(size * 0.24 + envelopeHeight * 0.35)} L${Math.round(size / 2)} ${Math.round(size * 0.24 + envelopeHeight * 0.72)} L${Math.round((size + envelopeWidth) / 2)} ${Math.round(size * 0.24 + envelopeHeight * 0.35)}" fill="none" stroke="#1e3a5f" stroke-width="${Math.max(2, Math.round(size * 0.015))}"/>
  <text x="50%" y="${Math.round(size * 0.78)}" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700">B</text>
</svg>`
}

async function loadSharp() {
  const mod = await import('sharp')
  return mod.default
}

function writeManifest() {
  const iconQuery = `?v=${ICON_VERSION}`
  const manifest = {
    name: 'Behördenpost',
    short_name: 'Behördenpost',
    description: 'Behördenpost digital verwalten — Briefe, Fristen und Antworten an einem Ort.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1e3a5f',
    theme_color: '#1e3a5f',
    icons: [
      {
        src: `/icon-180.png${iconQuery}`,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-192.png${iconQuery}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-512.png${iconQuery}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-512.png${iconQuery}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }

  const outPath = path.join(publicDir, 'manifest.webmanifest')
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return outPath
}

async function main() {
  const sharp = await loadSharp()
  fs.mkdirSync(publicDir, { recursive: true })

  for (const size of SIZES) {
    const svg = Buffer.from(iconSvg(size))
    const outPath = path.join(publicDir, `icon-${size}.png`)
    await sharp(svg).png({ compressionLevel: 9 }).toFile(outPath)
    console.log(`OK ${outPath}`)
  }

  fs.copyFileSync(path.join(publicDir, 'icon-180.png'), path.join(publicDir, 'apple-touch-icon.png'))
  console.log('OK public/apple-touch-icon.png')

  const manifestPath = writeManifest()
  console.log(`OK ${manifestPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

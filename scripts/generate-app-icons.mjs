#!/usr/bin/env node
/**
 * App-Icons für Behördenpost — Master-PNG → PNG-Größen.
 *
 *   npm run generate:app-icons
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const brandDir = path.join(publicDir, 'brand')
const MASTER_PNG = path.join(brandDir, 'app-icon-master.png')
const SIZES = [180, 192, 512]
const ICON_VERSION = 'behoerdenpost-2'

/** Fallback-SVG falls Master-PNG fehlt (CI / frischer Clone). */
function iconSvg(size) {
  const r = Math.round(size * 0.18)
  const envW = Math.round(size * 0.44)
  const envH = Math.round(size * 0.28)
  const envX = Math.round((size - envW) / 2)
  const envY = Math.round(size * 0.26)
  const sealR = Math.round(size * 0.055)
  const sealCx = Math.round(size * 0.68)
  const sealCy = Math.round(size * 0.34)

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#23466f"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <rect x="${envX}" y="${envY}" width="${envW}" height="${envH}" rx="${Math.round(size * 0.025)}" fill="#f8fafc"/>
  <path d="M${envX} ${envY + Math.round(envH * 0.32)} L${Math.round(size / 2)} ${envY + Math.round(envH * 0.78)} L${envX + envW} ${envY + Math.round(envH * 0.32)}" fill="none" stroke="#1e3a5f" stroke-width="${Math.max(2, Math.round(size * 0.012))}"/>
  <circle cx="${sealCx}" cy="${sealCy}" r="${sealR}" fill="#c9a227"/>
  <circle cx="${sealCx}" cy="${sealCy}" r="${Math.round(sealR * 0.55)}" fill="#1e3a5f" opacity="0.35"/>
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
      { src: `/icon-180.png${iconQuery}`, sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: `/icon-192.png${iconQuery}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `/icon-512.png${iconQuery}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `/icon-512.png${iconQuery}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  const outPath = path.join(publicDir, 'manifest.webmanifest')
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return outPath
}

async function main() {
  const sharp = await loadSharp()
  fs.mkdirSync(publicDir, { recursive: true })
  fs.mkdirSync(brandDir, { recursive: true })

  const hasMaster = fs.existsSync(MASTER_PNG)

  for (const size of SIZES) {
    const outPath = path.join(publicDir, `icon-${size}.png`)

    if (hasMaster) {
      await sharp(MASTER_PNG)
        .resize(size, size, { fit: 'cover' })
        .png({ compressionLevel: 9 })
        .toFile(outPath)
    } else {
      const svg = Buffer.from(iconSvg(size))
      await sharp(svg).png({ compressionLevel: 9 }).toFile(outPath)
    }

    console.log(`OK ${outPath}${hasMaster ? ' (from master)' : ' (svg fallback)'}`)
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

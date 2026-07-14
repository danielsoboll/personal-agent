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
const ICON_VERSION = 'behoerdenpost-3'

/** Fallback-SVG falls Master-PNG fehlt (CI / frischer Clone). Brief + Handy wie Leitbild. */
function iconSvg(size) {
  const r = Math.round(size * 0.18)
  const s = size

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" rx="${r}" fill="#f8fafc"/>
  <rect x="${Math.round(s * 0.08)}" y="${Math.round(s * 0.22)}" width="${Math.round(s * 0.36)}" height="${Math.round(s * 0.28)}" rx="${Math.round(s * 0.03)}" fill="#cbd5e1"/>
  <rect x="${Math.round(s * 0.12)}" y="${Math.round(s * 0.26)}" width="${Math.round(s * 0.28)}" height="${Math.round(s * 0.2)}" rx="${Math.round(s * 0.02)}" fill="#ffffff"/>
  <rect x="${Math.round(s * 0.52)}" y="${Math.round(s * 0.18)}" width="${Math.round(s * 0.34)}" height="${Math.round(s * 0.58)}" rx="${Math.round(s * 0.05)}" fill="#1e3a5f"/>
  <rect x="${Math.round(s * 0.56)}" y="${Math.round(s * 0.24)}" width="${Math.round(s * 0.26)}" height="${Math.round(s * 0.38)}" rx="${Math.round(s * 0.02)}" fill="#ffffff"/>
  <circle cx="${Math.round(s * 0.69)}" cy="${Math.round(s * 0.68)}" r="${Math.round(s * 0.035)}" fill="#ffffff" opacity="0.85"/>
  <ellipse cx="${Math.round(s * 0.22)}" cy="${Math.round(s * 0.34)}" rx="${Math.round(s * 0.08)}" ry="${Math.round(s * 0.09)}" fill="#94a3b8"/>
  <text x="${Math.round(s * 0.22)}" y="${Math.round(s * 0.38)}" text-anchor="middle" font-size="${Math.round(s * 0.11)}" fill="#ffffff" font-family="system-ui,sans-serif">?</text>
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
    description: 'Briefe mit dem Handy scannen und verstehen — persönlich, lokal, klar.',
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

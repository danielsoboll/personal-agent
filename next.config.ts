import type { NextConfig } from 'next'
import { networkInterfaces } from 'os'

/** Alle lokalen IPv4-Adressen — Next.js 16 blockiert sonst /_next/* vom Handy. */
function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>(['localhost', '127.0.0.1'])

  for (const interfaces of Object.values(networkInterfaces())) {
    for (const net of interfaces ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue
      origins.add(net.address)
      origins.add(`${net.address}:3002`)
    }
  }

  return [...origins]
}

const allowedDevOrigins = getAllowedDevOrigins()

const nextConfig: NextConfig = {
  allowedDevOrigins,
  devIndicators: false,
  images: {
    // Icon-Pfade nutzen Cache-Busting (?v=…) — Next 16 verlangt dafür localPatterns.
    localPatterns: [{ pathname: '/**' }],
  },
}

export default nextConfig

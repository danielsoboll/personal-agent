#!/usr/bin/env node
import { networkInterfaces } from 'os'

const port = process.env.PORT ?? '3002'
const ips = []

for (const interfaces of Object.values(networkInterfaces())) {
  for (const net of interfaces ?? []) {
    if (net.family === 'IPv4' && !net.internal) {
      ips.push(net.address)
    }
  }
}

console.log('')
console.log('Behördenpost — Dev-URLs')
console.log('───────────────────────')
console.log(`  Mac:    http://localhost:${port}`)
for (const ip of ips) {
  console.log(`  iPhone: http://${ip}:${port}`)
}
console.log('')
console.log('Wichtig (Next.js 16): Handy muss in allowedDevOrigins stehen.')
console.log('Falls Buttons/Theme tot sind → npm run dev:phone (Produktionsmodus).')
console.log('')

import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native iOS-Hülle lädt die Live-App.
 * Document-Picker (Dokumente/iCloud) läuft nur in dieser App — nicht in Safari.
 *
 * Lokal gegen Dev-Server: server.url auf http://DEINE-LAN-IP:3002 setzen.
 */
const config: CapacitorConfig = {
  appId: 'de.lifexp.behoerdenpost',
  appName: 'Behördenpost',
  webDir: 'public',
  server: {
    url: 'https://post.life-xp.de',
    cleartext: false,
    allowNavigation: ['post.life-xp.de', '*.life-xp.de', 'localhost', '127.0.0.1'],
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Behoerdenpost',
  },
}

export default config

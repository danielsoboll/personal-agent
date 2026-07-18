# Native iOS-App (Dokumente-Ordner)

Safari/PWA kann den Ordner **Dokumente / iCloud Drive** nicht öffnen. Die Capacitor-App kann das.

## Voraussetzung

- **Xcode** aus dem App Store (voll, nicht nur Command Line Tools)
- Apple-ID / Entwickler-Team zum Signieren
- iPhone per USB oder Simulator

## Einmalig

```bash
cd ~/personal-agent
npm install
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Target **App** → **Signing & Capabilities** → dein Team
2. Bundle ID: `de.lifexp.behoerdenpost`
3. iPhone wählen → **Run** (▶)

Die App lädt `https://post.life-xp.de`. **Dokument hochladen** öffnet den nativen Picker mit Start in **iCloud Drive → Dokumente** (soweit iOS das zulässt).

## Lokal gegen Dev-Server

In `capacitor.config.ts` kurz umstellen:

```ts
server: {
  url: 'http://DEINE-LAN-IP:3002',
  cleartext: true,
}
```

Dann `npx cap sync ios` und in Xcode neu bauen.

## Skripte

| | |
|---|---|
| `npm run cap:sync` | Native Projekt mit Config synchronisieren |
| `npm run cap:open` | Xcode öffnen |

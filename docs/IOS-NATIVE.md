# Native iOS-App (optional)

Die Capacitor-Hülle lädt `https://post.life-xp.de`. **Dokument hochladen** nutzt wieder den normalen Web-`<input type="file">` (voller iOS-Dateien-Dialog mit iCloud, Downloads, …) — auch innerhalb der App. Der native `DocumentsPicker` mit `directoryURL` wird nicht mehr verwendet.

Zum Öffnen in Xcode (nur bei Bedarf): `npx cap sync ios` / `npx cap open ios`. Für Upload-Fixes reicht ein Web-Deploy — kein neuer Capacitor-Build nötig.

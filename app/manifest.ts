import type { MetadataRoute } from 'next'

import { APP_ICON_VERSION, APP_NAME } from '@/lib/appIcon'
import { APP_DESCRIPTION } from '@/lib/privacyCopy'

export default function manifest(): MetadataRoute.Manifest {
  const iconQuery = `?v=${APP_ICON_VERSION}`

  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
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
}

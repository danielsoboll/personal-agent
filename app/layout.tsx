import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { APP_ICON_PATHS, APP_NAME } from '@/lib/appIcon'
import { APP_DESCRIPTION } from '@/lib/privacyCopy'
import KeyboardViewportRoot from '@/components/KeyboardViewportRoot'
import ThemeHydration from '@/components/ThemeHydration'
import { THEME_FALLBACK_BG_LIGHT, themeInitScript } from '@/lib/theme'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: APP_ICON_PATHS[192], sizes: '192x192', type: 'image/png' },
      { url: APP_ICON_PATHS[512], sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: APP_ICON_PATHS[180], sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e3a5f' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning style={{ backgroundColor: THEME_FALLBACK_BG_LIGHT }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased bg-background text-foreground`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeHydration />
        <KeyboardViewportRoot />
        {children}
      </body>
    </html>
  )
}

'use client'

import { useEffect } from 'react'

import { attachPwaInstallListener } from '@/lib/pwaInstall'

export default function PwaInstallListener() {
  useEffect(() => {
    attachPwaInstallListener()
  }, [])

  return null
}

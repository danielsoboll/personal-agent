'use server'

import { redirect } from 'next/navigation'

export async function continueWithCaseTitle(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return

  redirect(`/name?draft=${encodeURIComponent(title)}`)
}

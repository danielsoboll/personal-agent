import { redirect } from 'next/navigation'

/** Vorname-Schritt entfällt — alte Links leiten auf „Neuer Fall“ um. */
export default function NamePage() {
  redirect('/fall/neu')
}

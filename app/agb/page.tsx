import LegalPage from '@/components/legal/LegalPage'
import { AGB_SECTIONS } from '@/lib/legalContent'

export default function AgbPage() {
  return <LegalPage title="Allgemeine Geschäftsbedingungen" sections={AGB_SECTIONS} />
}

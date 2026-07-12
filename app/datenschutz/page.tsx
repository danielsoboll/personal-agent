import LegalPage from '@/components/legal/LegalPage'
import { DATENSCHUTZ_SECTIONS } from '@/lib/legalContent'

export default function DatenschutzPage() {
  return <LegalPage title="Datenschutzerklärung" sections={DATENSCHUTZ_SECTIONS} />
}

import LegalPage from '@/components/legal/LegalPage'
import { HAFTUNG_SECTIONS } from '@/lib/legalContent'

export default function HaftungPage() {
  return <LegalPage title="Haftung" sections={HAFTUNG_SECTIONS} />
}

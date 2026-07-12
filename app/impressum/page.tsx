import LegalPage from '@/components/legal/LegalPage'
import { IMPRESSUM_SECTIONS } from '@/lib/legalContent'

export default function ImpressumPage() {
  return <LegalPage title="Impressum" sections={IMPRESSUM_SECTIONS} />
}

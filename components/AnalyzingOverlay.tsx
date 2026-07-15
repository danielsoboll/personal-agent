import BrandMark from '@/components/brand/BrandMark'
import { PRIVACY_ANALYZING_OVERLAY } from '@/lib/privacyCopy'

type AnalyzingOverlayProps = {
  message?: string
}

export default function AnalyzingOverlay({
  message = 'Fotos werden geprüft …',
}: AnalyzingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface px-6 py-8 text-center shadow-lg">
        <div className="mx-auto w-fit animate-pulse">
          <BrandMark variant="overlay" />
        </div>
        <p className="mt-4 text-lg font-semibold">{message}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{PRIVACY_ANALYZING_OVERLAY}</p>
      </div>
    </div>
  )
}

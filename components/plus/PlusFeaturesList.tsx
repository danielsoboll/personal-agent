import { PLUS_FEATURES } from '@/lib/plusFeatures'
import { PLUS_FEATURE_ITEM_CLASS } from '@/lib/plusShell'

type PlusFeaturesListProps = {
  className?: string
}

export default function PlusFeaturesList({ className = 'mt-4' }: PlusFeaturesListProps) {
  return (
    <ul className={`${className} space-y-2.5`}>
      {PLUS_FEATURES.map((feature) => (
        <li key={feature.id} className={PLUS_FEATURE_ITEM_CLASS}>
          <span className="text-2xl leading-none" aria-hidden>
            {feature.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">{feature.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{feature.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

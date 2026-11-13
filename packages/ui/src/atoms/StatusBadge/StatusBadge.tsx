import type { ReactNode } from 'react'

export type Tone = 'ok' | 'warning' | 'error' | 'neutral'

/** Status is always written in words; the tone only reinforces it. */
export function StatusBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="fh-status" data-tone={tone === 'neutral' ? undefined : tone}>
      {children}
    </span>
  )
}

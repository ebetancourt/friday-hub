import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export type BannerProps = {
  tone?: 'info' | 'ok' | 'warning' | 'error'
  title: ReactNode
  children?: ReactNode
  actions?: ReactNode
}

const icons = { info: Info, ok: CircleCheck, warning: TriangleAlert, error: CircleAlert }

export function Banner({ tone = 'info', title, children, actions }: BannerProps) {
  const Icon = icons[tone]
  return (
    <div className="fh-banner" data-tone={tone === 'info' ? undefined : tone} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className="fh-icon" aria-hidden />
      <div className="fh-banner-body">
        <span className="fh-banner-title">{title}</span>
        {children && <span>{children}</span>}
        {actions && <div className="fh-banner-actions">{actions}</div>}
      </div>
    </div>
  )
}

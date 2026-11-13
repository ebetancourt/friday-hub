import type { ReactNode } from 'react'

export type CardProps = {
  title: ReactNode
  description?: ReactNode
  /** Top-right slot, usually a StatusBadge. */
  status?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}

export function Card({ title, description, status, footer, children }: CardProps) {
  return (
    <section className="fh-card">
      <div className="fh-card-header">
        <div>
          <h2 className="fh-card-title">{title}</h2>
          {description && <p className="fh-card-description">{description}</p>}
        </div>
        {status}
      </div>
      {children}
      {footer && <div className="fh-card-footer">{footer}</div>}
    </section>
  )
}

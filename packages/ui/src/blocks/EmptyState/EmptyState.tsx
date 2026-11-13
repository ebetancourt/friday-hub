import type { ReactNode } from 'react'

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="fh-empty">
      <span className="fh-empty-icon">{icon}</span>
      <h2 className="fh-empty-title">{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

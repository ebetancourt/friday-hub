import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="fh-page-header">
      <div>
        <h1 className="fh-page-title">{title}</h1>
        {description && <p className="fh-page-description">{description}</p>}
      </div>
      {actions}
    </header>
  )
}

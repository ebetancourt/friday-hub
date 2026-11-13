import { Activity, KeyRound, Plug, User } from 'lucide-react'
import type { ReactNode } from 'react'

export type Section = 'connections' | 'activity' | 'tokens' | 'account'

const nav = [
  { id: 'connections', label: 'Connections', href: '/', Icon: Plug },
  { id: 'activity', label: 'Sync activity', href: '/activity', Icon: Activity },
  { id: 'tokens', label: 'API tokens', href: '/tokens', Icon: KeyRound },
  { id: 'account', label: 'Account', href: '/account', Icon: User },
] as const

/** The frame around every signed-in page. */
export function AppShell({ current, children }: { current: Section; children: ReactNode }) {
  return (
    <div className="fh-shell">
      <nav className="fh-sidebar" aria-label="Main">
        <div className="fh-brand">
          <span className="fh-brand-mark" aria-hidden />
          Friday Hub
        </div>
        {nav.map(({ id, label, href, Icon }) => (
          <a key={id} className="fh-nav-item" href={href} aria-current={id === current ? 'page' : undefined}>
            <Icon className="fh-icon" aria-hidden />
            {label}
          </a>
        ))}
      </nav>
      <main className="fh-main">{children}</main>
    </div>
  )
}

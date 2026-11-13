import { Plug, Plus, RefreshCw } from 'lucide-react'
import { Button } from '../../atoms/Button/Button.tsx'
import { StatusBadge, type Tone } from '../../atoms/StatusBadge/StatusBadge.tsx'
import { Banner } from '../../blocks/Banner/Banner.tsx'
import { Card } from '../../blocks/Card/Card.tsx'
import { EmptyState } from '../../blocks/EmptyState/EmptyState.tsx'
import { PageHeader } from '../../blocks/PageHeader/PageHeader.tsx'
import { AppShell } from '../AppShell/AppShell.tsx'

export type ConnectionStatus = 'active' | 'needs_reconnect' | 'disabled' | 'error'

export type ConnectionView = {
  id: string
  connectorName: string
  /** The upstream account, e.g. an email address. */
  account: string
  /** User-chosen, e.g. "Work". */
  label?: string
  status: ConnectionStatus
  /** e.g. "Last synced 4 minutes ago." */
  detail: string
}

export type ConnectionsPageProps = {
  connections: ConnectionView[]
  /** Connection types the user can add. Every type allows more than one account. */
  connectors: { id: string; name: string }[]
  onConnect: (connectorId: string) => void
  onReconnect: (connectionId: string) => void
  onDisconnect: (connectionId: string) => void
  onSync: (connectionId: string) => void
}

const badge: Record<ConnectionStatus, [Tone, string]> = {
  active: ['ok', 'Healthy'],
  needs_reconnect: ['warning', 'Reconnect needed'],
  disabled: ['neutral', 'Paused'],
  error: ['error', 'Sync failed'],
}

export function ConnectionsPage({ connections, connectors, onConnect, onReconnect, onDisconnect, onSync }: ConnectionsPageProps) {
  const broken = connections.filter((c) => c.status === 'needs_reconnect')
  return (
    <AppShell current="connections">
      <PageHeader
        title="Connections"
        description="Accounts Friday Hub syncs for you. Connect as many accounts of each type as you need."
        actions={
          <div className="fh-card-footer">
            {connectors.map((c) => (
              <Button key={c.id} variant="primary" icon={<Plus className="fh-icon" aria-hidden />} onPress={() => onConnect(c.id)}>
                Connect {c.name}
              </Button>
            ))}
          </div>
        }
      />
      <div className="fh-stack">
        {broken.map((c) => (
          <Banner key={c.id} tone="warning" title={`${c.connectorName} (${c.account}) needs reconnecting`}>
            Sync is paused until you reconnect.
          </Banner>
        ))}
        {connections.length === 0 ? (
          <EmptyState icon={<Plug className="fh-icon" aria-hidden />} title="No connections yet">
            Connect an account to start syncing it.
          </EmptyState>
        ) : (
          <div className="fh-grid">
            {connections.map((c) => {
              const [tone, text] = badge[c.status]
              return (
                <Card
                  key={c.id}
                  title={c.label ? `${c.connectorName} · ${c.label}` : c.connectorName}
                  description={c.account}
                  status={<StatusBadge tone={tone}>{text}</StatusBadge>}
                  footer={
                    <>
                      {c.status === 'needs_reconnect' ? (
                        <Button size="sm" onPress={() => onReconnect(c.id)}>
                          Reconnect {c.connectorName}
                        </Button>
                      ) : (
                        <Button size="sm" icon={<RefreshCw className="fh-icon" aria-hidden />} onPress={() => onSync(c.id)}>
                          Sync now
                        </Button>
                      )}
                      <Button size="sm" variant="quiet" onPress={() => onDisconnect(c.id)}>
                        Disconnect
                      </Button>
                    </>
                  }
                >
                  <p className="fh-card-description">{c.detail}</p>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

// A route only fetches and wires handlers; the page itself is a ui template.
import { ConnectionsPage } from '@friday-hub/ui'
import { api } from '../api.ts'

export function ConnectionsRoute() {
  const catalogue = api.query.useQuery('get', '/v1/connectors')
  const todo = (what: string) => () => alert(`${what}: not built yet (docs/build-plan.md)`)
  return (
    <ConnectionsPage
      connectors={catalogue.data?.connectors ?? []}
      connections={[]} // GET /v1/connections arrives with the first build slice
      onConnect={todo('Connect')}
      onReconnect={todo('Reconnect')}
      onDisconnect={todo('Disconnect')}
      onSync={todo('Sync')}
    />
  )
}

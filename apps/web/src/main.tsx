import '@friday-hub/ui/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionsRoute } from './routes/connections.tsx'

// ponytail: one page, no router yet. Add one with the second page.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <ConnectionsRoute />
    </QueryClientProvider>
  </StrictMode>,
)

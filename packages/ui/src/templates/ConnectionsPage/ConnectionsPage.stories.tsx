import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ConnectionsPage, type ConnectionView } from './ConnectionsPage.tsx'

const google: ConnectionView = {
  id: '1',
  connectorName: 'Google',
  account: 'ada@example.com',
  label: 'Personal',
  status: 'active',
  detail: 'Last synced 4 minutes ago.',
}

const meta = {
  title: 'Templates/Connections page',
  component: ConnectionsPage,
  parameters: { layout: 'fullscreen' },
  args: {
    connectors: [
      { id: 'google', name: 'Google' },
      { id: 'todoist', name: 'Todoist' },
    ],
    connections: [],
    onConnect: fn(),
    onReconnect: fn(),
    onDisconnect: fn(),
    onSync: fn(),
  },
} satisfies Meta<typeof ConnectionsPage>
export default meta
type Story = StoryObj<typeof meta>

export const Healthy: Story = {
  args: {
    connections: [google, { id: '2', connectorName: 'Todoist', account: 'ada@example.com', status: 'active', detail: 'Last synced 2 minutes ago.' }],
  },
}

export const MultipleAccounts: Story = {
  args: {
    connections: [
      google,
      { ...google, id: '3', account: 'ada@work.example', label: 'Work', detail: 'Last synced 6 minutes ago.' },
    ],
  },
}

export const NeedsReconnecting: Story = {
  args: {
    connections: [
      google,
      { id: '2', connectorName: 'Todoist', account: 'ada@example.com', status: 'needs_reconnect', detail: 'Last synced 12 Nov at 09:40.' },
    ],
  },
}

export const SyncFailed: Story = {
  args: { connections: [{ ...google, status: 'error', detail: 'Google returned "rate limit exceeded". Retrying at 14:30.' }] },
}

export const Empty: Story = {}

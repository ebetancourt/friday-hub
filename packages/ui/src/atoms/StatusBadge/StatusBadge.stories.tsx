import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusBadge } from './StatusBadge.tsx'

const meta = { title: 'Atoms/StatusBadge', component: StatusBadge } satisfies Meta<typeof StatusBadge>
export default meta
type Story = StoryObj<typeof meta>

export const Healthy: Story = { args: { tone: 'ok', children: 'Healthy' } }
export const NeedsReconnect: Story = { args: { tone: 'warning', children: 'Reconnect needed' } }
export const Failed: Story = { args: { tone: 'error', children: 'Sync failed' } }
export const Paused: Story = { args: { tone: 'neutral', children: 'Paused' } }

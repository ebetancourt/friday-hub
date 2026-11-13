import type { Meta, StoryObj } from '@storybook/react-vite'
import { PageHeader } from '../../blocks/PageHeader/PageHeader.tsx'
import { AppShell } from './AppShell.tsx'

const meta = {
  title: 'Templates/App shell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppShell>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { current: 'activity', children: <PageHeader title="Sync activity" /> } }

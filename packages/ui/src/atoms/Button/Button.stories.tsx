import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from './Button.tsx'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: { children: 'Connect Google' },
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Secondary: Story = {}
export const Primary: Story = { args: { variant: 'primary', icon: <Plus className="fh-icon" aria-hidden /> } }
export const Quiet: Story = { args: { variant: 'quiet', children: 'Manage scopes' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Revoke token' } }
export const Small: Story = { args: { size: 'sm', icon: <RefreshCw className="fh-icon" aria-hidden />, children: 'Sync now' } }
export const Disabled: Story = { args: { isDisabled: true } }

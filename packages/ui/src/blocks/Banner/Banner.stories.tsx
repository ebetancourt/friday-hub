import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../../atoms/Button/Button.tsx'
import { Banner } from './Banner.tsx'

const meta = { title: 'Blocks/Banner', component: Banner } satisfies Meta<typeof Banner>
export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { title: 'Google review in progress', children: 'Until Google approves Friday Hub, sign-in shows an "unverified app" warning.' },
}
export const Ok: Story = { args: { tone: 'ok', title: 'Todoist connected', children: 'The first sync is running.' } }
export const Warning: Story = {
  args: {
    tone: 'warning',
    title: 'Google needs reconnecting',
    children: 'Access was revoked on 12 Nov. Sync is paused until you reconnect.',
    actions: <Button size="sm">Reconnect Google</Button>,
  },
}
export const Error: Story = {
  args: { tone: 'error', title: 'Calendar sync failed 3 times', children: 'Google returned "rate limit exceeded". Friday Hub retries at 14:30.' },
}

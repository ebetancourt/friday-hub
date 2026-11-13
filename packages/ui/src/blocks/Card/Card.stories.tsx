import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../../atoms/Button/Button.tsx'
import { StatusBadge } from '../../atoms/StatusBadge/StatusBadge.tsx'
import { Card } from './Card.tsx'

const meta = { title: 'Blocks/Card', component: Card } satisfies Meta<typeof Card>
export default meta
type Story = StoryObj<typeof meta>

export const Connection: Story = {
  args: {
    title: 'Google',
    description: 'ada@example.com · Gmail, Calendar, Drive',
    status: <StatusBadge tone="ok">Healthy</StatusBadge>,
    children: <p className="fh-card-description">Last synced 4 minutes ago.</p>,
    footer: (
      <>
        <Button size="sm">Sync now</Button>
        <Button size="sm" variant="quiet">
          Disconnect
        </Button>
      </>
    ),
  },
}
export const Plain: Story = { args: { title: 'Account', description: 'ada@example.com' } }

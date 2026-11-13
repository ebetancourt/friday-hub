import type { Meta, StoryObj } from '@storybook/react-vite'
import { KeyRound, Plus } from 'lucide-react'
import { Button } from '../../atoms/Button/Button.tsx'
import { EmptyState } from './EmptyState.tsx'

const meta = { title: 'Blocks/EmptyState', component: EmptyState } satisfies Meta<typeof EmptyState>
export default meta
type Story = StoryObj<typeof meta>

export const NoTokens: Story = {
  args: {
    icon: <KeyRound className="fh-icon" aria-hidden />,
    title: 'No API tokens yet',
    children: 'Create a token to let an app or agent read and change your connected accounts.',
    action: (
      <Button variant="primary" icon={<Plus className="fh-icon" aria-hidden />}>
        Create token
      </Button>
    ),
  },
}

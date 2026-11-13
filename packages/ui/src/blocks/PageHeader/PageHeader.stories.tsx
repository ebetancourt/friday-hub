import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import { Button } from '../../atoms/Button/Button.tsx'
import { PageHeader } from './PageHeader.tsx'

const meta = { title: 'Blocks/PageHeader', component: PageHeader } satisfies Meta<typeof PageHeader>
export default meta
type Story = StoryObj<typeof meta>

export const WithAction: Story = {
  args: {
    title: 'API tokens',
    description: 'Tokens let your apps and agents use your connected accounts.',
    actions: (
      <Button variant="primary" icon={<Plus className="fh-icon" aria-hidden />}>
        Create token
      </Button>
    ),
  },
}
export const TitleOnly: Story = { args: { title: 'Account' } }

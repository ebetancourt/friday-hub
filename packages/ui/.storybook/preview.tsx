import type { Preview } from '@storybook/react-vite'
import '../src/styles.css'

export default {
  parameters: {
    // Any axe violation fails the story's test (pnpm test, and CI).
    a11y: { test: 'error' },
    options: { storySort: { order: ['Atoms', 'Blocks', 'Templates'] } },
  },
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, { globals }) => {
      document.documentElement.dataset.theme = globals.theme
      return <Story />
    },
  ],
} satisfies Preview

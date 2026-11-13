# Friday Hub design system

Friday Hub connects a person's Gmail, Calendar, Drive and Todoist and lets their apps and agents use them through one API. The interface is a small, calm control panel. People come to connect an account, check that sync is healthy, fix it when it isn't, and manage API tokens. Every screen should answer "is it working?" before anything else.

It has one purple accent, a roomy density and 23 components in three tiers.

## Voice

- Plain, specific and calm. Say what happened, what it means and what happens next: "Access was revoked on 12 Nov. Sync is paused until you reconnect."
- Name things the way people know them: Gmail, Calendar, Drive, Todoist, API tokens. Never mention OAuth, refresh tokens or job queues in the UI.
- Buttons start with a verb and repeat the object: "Connect Google", "Revoke token". Sentence case everywhere.
- Numbers, not adjectives: "1,284 tasks", "3 failed runs", "4 minutes ago".
- No exclamation marks, no emoji, no apologies in errors. Quote the provider's error and say whether Friday Hub will retry.

## Colour

- **Friday purple** (`accent`) marks what you can act on: primary buttons, links, the current nav item and focus rings. It never marks status.
- Neutrals carry a slight purple bias. The page uses `bg`; cards, the sidebar, inputs and dialogs use `surface`; hover fills and table headers use `surface-muted`.
- Text is `text` or `text-muted`. Both read at 6:1 or better on `bg`, `surface` and `surface-muted` in both themes. Text on an accent fill is always `on-accent`.
- Status has four tones, each a pair: `ok`/`ok-bg`, `warning`/`warning-bg`, `error`/`error-bg`, and neutral (`text-muted` on `surface-muted`). Info uses `accent` on `accent-subtle`. Status is always written in words too, never colour alone.
- Hairlines use `border`, which is decorative. Edges that define a control (inputs, checkboxes, secondary buttons) use `border-strong`, which meets 3:1 on `surface`.
- Light and dark themes are designed together. The OS preference decides, and `data-theme="light"` or `"dark"` on `<html>` overrides it.

## Type

- One family: the system UI stack (`font-sans`). Code, tokens and scopes use `font-mono`. Friday Hub ships no font files.
- The base is 16px/24px (`body`). Page titles use `title` (24px); card and dialog titles use `heading` (18px). `display` (32px) appears only on sign-in and onboarding.
- Labels and table headers use `label` (14px, 600). Descriptions and table cells use `small` (14px). Badges use `caption` (13px, 600).
- Keep running text near 65 characters wide.

## Space, shape, depth

- Spacing steps are 4, 8, 12, 16, 24, 32 and 48px (`space-1` to `space-12`). Use `space-4` between fields and cards, `space-6` inside cards and dialogs, and `space-8` around the main content.
- Controls are 40px tall (`control-md`); compact row buttons are 32px (`control-sm`).
- Radius: 8px (`radius-md`) for controls, 12px (`radius-lg`) for containers, and full rounding for badges.
- Surfaces are flat. Cards get a border, not a shadow. `shadow-2` is reserved for things that float: dialogs, toasts and popovers.

## Iconography

- Lucide only, through `lucide-react`: 18px, 2px stroke, `currentColor`.
- An icon sits before its label and never replaces it, except in an IconButton, which must have an accessible name and a tooltip.
- There are no illustrations. Empty states use one Lucide icon in an `accent-subtle` disc.
- Friday Hub has no logo yet. The wordmark is "Friday Hub" in `heading` weight beside a 24px accent square with `radius-sm` corners.

## Accessibility

- WCAG 2.2 AA in both themes. Keyboard focus shows a 2px `focus` ring, offset 2px.
- Every interactive component is built on React Aria Components, so keyboard, focus and screen reader behaviour come from there and are not hand-rolled.
- Under reduced motion, transitions drop to 0ms and the spinner turns slowly.

## Structure: atoms, blocks, templates

Components are organised in three tiers, and imports only point downward.

| Tier | What it is | Built | Still to build |
| --- | --- | --- | --- |
| **Atoms** | The smallest controls and labels. No layout and no page knowledge. | Button, StatusBadge | IconButton, Link, Input, Checkbox, Spinner |
| **Blocks** | Atoms put together into a reusable unit with its own layout. | Banner, Card, EmptyState, PageHeader | TextField, Select, CopyField, Toast, Table, Dialog |
| **Templates** | Whole pages and the frame around them. They take data through props and fetch nothing. | AppShell, ConnectionsPage | SignInPage, SyncActivityPage, ApiTokensPage, AccountPage |

Blocks combine what Atomic Design calls molecules and organisms; at this size the split adds debate without much benefit. A template is the whole page, filled with sample data in Storybook and with real data in `apps/web`, which only wires data and handlers into it.

Every class recipe the remaining components need already exists in `src/components.css` (`.fh-input`, `.fh-table`, `.fh-dialog`, …). Building one means a thin React component over React Aria Components plus its stories.

## Files

```
packages/ui/
  tokens.json            source of truth for tokens
  scripts/tokens.ts      tokens.json → src/tokens.css  (pnpm --filter @friday-hub/ui tokens)
  src/tokens.css         generated; colours use light-dark()
  src/components.css     every fh-* class recipe
  src/styles.css         imports both; apps import '@friday-hub/ui/styles.css'
  src/atoms/Button/      Button.tsx · Button.stories.tsx
  src/blocks/Card/       Card.tsx · Card.stories.tsx
  src/templates/ConnectionsPage/   ConnectionsPage.tsx · ConnectionsPage.stories.tsx
  .storybook/            main.ts, preview.tsx (theme toolbar, a11y as errors, tier order)
  vitest.config.ts       runs every story as a test in headless Chromium
```

## Storybook

- `pnpm storybook` serves it on :6006. The sidebar follows the tiers: `Atoms/Button`, `Blocks/Card`, `Templates/Connections page`.
- The toolbar's theme switch sets `data-theme` on `<html>`, so every story can be checked in light and dark.
- Every story is also a test (`pnpm test`). The accessibility addon runs axe on each one, and a violation fails the run in CI. Today the automated check runs in the light theme; dark-theme contrast was checked by hand.
- Template stories cover the states that matter: healthy, multiple accounts, needs reconnecting, sync failed, empty.

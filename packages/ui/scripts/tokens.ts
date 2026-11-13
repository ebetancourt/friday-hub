// tokens.json -> src/tokens.css. Run with `pnpm --filter @friday-hub/ui tokens`.
// Colours use light-dark(); the OS decides, data-theme on <html> overrides.
import { readFileSync, writeFileSync } from 'node:fs'

type Themed = string | { light: string; dark: string }
type Token = { name: string; value: Themed }

const t = JSON.parse(readFileSync(new URL('../tokens.json', import.meta.url), 'utf8'))
const ref = (v: string) => v.replace(/^\{(.+)\}$/, 'var(--$1)')
const val = (v: Themed) => (typeof v === 'string' ? ref(v) : `light-dark(${ref(v.light)}, ${ref(v.dark)})`)
const block = (tokens: Token[]) => tokens.map((x) => `  --${x.name}: ${val(x.value)};`)

const lines = [
  '/* Generated from tokens.json by scripts/tokens.ts. Do not edit. */',
  ':root {',
  '  color-scheme: light dark;',
  ...Object.entries(t.type.families as Record<string, string>).map(([k, v]) => `  --font-${k}: ${v};`),
  ...block(t.color.tokens),
  ...block(t.spacing.tokens),
  ...block(t.radius.tokens),
  ...block(t.shadow.tokens),
  ...block(t.size.tokens),
  '}',
  ':root[data-theme="light"] { color-scheme: light; }',
  ':root[data-theme="dark"] { color-scheme: dark; }',
  '',
]
writeFileSync(new URL('../src/tokens.css', import.meta.url), lines.join('\n'))

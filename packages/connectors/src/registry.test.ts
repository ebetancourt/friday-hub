import { validateConnector } from '@friday-hub/sdk'
import { expect, test } from 'vitest'
import template from './_template/index.ts'
import { connectors } from './registry.ts'

test.each([...connectors, template].map((c) => [c.id, c] as const))('%s satisfies the connector contract', (_, c) => {
  expect(validateConnector(c)).toEqual([])
})

test('connector ids are unique', () => {
  const ids = connectors.map((c) => c.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('validation catches an undeclared scope', () => {
  const bad = { ...template, actions: { x: { ...template.actions.listThings, scope: 'example:write' } } }
  expect(validateConnector(bad)).toEqual(['example: action x uses undeclared scope "example:write"'])
})

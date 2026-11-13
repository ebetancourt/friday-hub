import type { Connector } from '@friday-hub/sdk'
import google from './google/index.ts'
import todoist from './todoist/index.ts'

/** Every connector the server mounts. Adding one is one import and one entry. */
export const connectors: Connector[] = [google, todoist]

export const connectorById = (id: string) => connectors.find((c) => c.id === id)

import type { Dictionary, Group } from '../shared/types'

const BASE = '/api/admin'

export interface GroupInput {
  name: string
  note: string
  isPublished: boolean
  elements: string[]
}

export interface ImportResult {
  imported: string[]
  skipped: { name: string; reason: string }[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(body.error ?? `APIエラー (${res.status})`)
  }
  return body
}

export function fetchDictionary(): Promise<Dictionary> {
  return request<Dictionary>('/dictionary')
}

export function createGroup(input: GroupInput): Promise<Group> {
  return request<Group>('/groups', { method: 'POST', body: JSON.stringify(input) })
}

export function updateGroup(id: string, input: GroupInput): Promise<Group> {
  return request<Group>(`/groups/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteGroup(id: string): Promise<void> {
  return request<void>(`/groups/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function importGroups(
  groups: { name: string; elements: string[] }[],
): Promise<ImportResult> {
  return request<ImportResult>('/import', {
    method: 'POST',
    body: JSON.stringify({ groups }),
  })
}

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { Dictionary, Group } from '../src/shared/types'
import { validateElementName } from '../src/shared/validate'

const DICTIONARY_PATH = resolve(import.meta.dirname, '../public/data/dictionary.json')

function loadDictionary(): Dictionary {
  return JSON.parse(readFileSync(DICTIONARY_PATH, 'utf-8')) as Dictionary
}

function saveDictionary(dict: Dictionary): void {
  writeFileSync(DICTIONARY_PATH, JSON.stringify(dict, null, 2) + '\n')
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((res, rej) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => res(body))
    req.on('error', rej)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

interface GroupInput {
  name?: unknown
  note?: unknown
  isPublished?: unknown
  elements?: unknown
}

/**
 * 検証済みの入力から保存用の共通フィールドを組み立てる。
 * validateGroupInput を通過した入力に対してのみ呼ぶこと。
 */
function groupFieldsFrom(
  input: GroupInput,
): Pick<Group, 'name' | 'note' | 'isPublished' | 'elements'> {
  return {
    name: (input.name as string).trim(),
    note: typeof input.note === 'string' ? input.note : '',
    isPublished: input.isPublished !== false,
    elements: input.elements as string[],
  }
}

/**
 * ローカル管理API用のオリジン検証。同一マシンのブラウザからの利用のみを
 * 想定しているため、外部サイトのページからのクロスオリジン要求
 * （プリフライトの走らないシンプルリクエスト含む）を拒否する。
 * Originヘッダが付かない要求（curl等）はローカル操作とみなして許可する。
 */
function isAllowedOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin
  if (origin === undefined) return true
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

/** グループ入力の検証。エラーメッセージまたはnullを返す */
function validateGroupInput(input: GroupInput): string | null {
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    return 'グループ名は必須です'
  }
  if (!Array.isArray(input.elements) || input.elements.length === 0) {
    return '要素は1つ以上必要です'
  }
  for (const el of input.elements) {
    if (typeof el !== 'string') return '要素は文字列で指定してください'
    const err = validateElementName(el)
    if (err !== null) return `要素「${el}」: ${err}`
  }
  return null
}

/**
 * ローカル管理画面用のAPI。Vite開発サーバー起動時のみ有効で、
 * ビルド成果物には一切含まれない。辞書マスターJSONを直接読み書きする。
 */
export function adminApiPlugin(): Plugin {
  return {
    name: 'nazogura-admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin', (req, res) => {
        if (!isAllowedOrigin(req)) {
          sendJson(res, 403, { error: 'forbidden origin' })
          return
        }
        void handle(req, res).catch((err: unknown) => {
          console.error('[admin-api]', err)
          sendJson(res, 500, { error: 'サーバー内部でエラーが発生しました' })
        })
      })
    },
  }
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // middlewares.use('/api/admin', ...) 配下では url からプレフィックスが除かれている
  const url = (req.url ?? '/').split('?')[0]
  const method = req.method ?? 'GET'

  if (url === '/dictionary' && method === 'GET') {
    sendJson(res, 200, loadDictionary())
    return
  }

  if (url === '/groups' && method === 'POST') {
    const input = JSON.parse(await readBody(req)) as GroupInput
    const err = validateGroupInput(input)
    if (err !== null) {
      sendJson(res, 400, { error: err })
      return
    }
    const dict = loadDictionary()
    const now = new Date().toISOString()
    const group: Group = {
      id: randomUUID(),
      ...groupFieldsFrom(input),
      createdAt: now,
      updatedAt: now,
    }
    dict.groups.push(group)
    saveDictionary(dict)
    sendJson(res, 201, group)
    return
  }

  const groupMatch = url.match(/^\/groups\/([^/]+)$/)
  if (groupMatch) {
    const id = decodeURIComponent(groupMatch[1])
    const dict = loadDictionary()
    const index = dict.groups.findIndex((g) => g.id === id)
    if (index === -1) {
      sendJson(res, 404, { error: 'グループが見つかりません' })
      return
    }

    if (method === 'PUT') {
      const input = JSON.parse(await readBody(req)) as GroupInput
      const err = validateGroupInput(input)
      if (err !== null) {
        sendJson(res, 400, { error: err })
        return
      }
      const current = dict.groups[index]
      const updated: Group = {
        ...current,
        ...groupFieldsFrom(input),
        updatedAt: new Date().toISOString(),
      }
      dict.groups[index] = updated
      saveDictionary(dict)
      sendJson(res, 200, updated)
      return
    }

    if (method === 'DELETE') {
      dict.groups.splice(index, 1)
      saveDictionary(dict)
      sendJson(res, 200, { ok: true })
      return
    }
  }

  if (url === '/import' && method === 'POST') {
    const input = JSON.parse(await readBody(req)) as {
      groups?: { name?: unknown; elements?: unknown }[]
    }
    if (!Array.isArray(input.groups)) {
      sendJson(res, 400, { error: 'groupsが必要です' })
      return
    }
    const dict = loadDictionary()
    const now = new Date().toISOString()
    const imported: string[] = []
    const skipped: { name: string; reason: string }[] = []
    for (const g of input.groups) {
      const err = validateGroupInput({ ...g, isPublished: true })
      const name = typeof g.name === 'string' ? g.name.trim() : ''
      if (err !== null) {
        skipped.push({ name, reason: err })
        continue
      }
      if (dict.groups.some((existing) => existing.name === name)) {
        skipped.push({ name, reason: '同名のグループが既に存在します' })
        continue
      }
      dict.groups.push({
        id: randomUUID(),
        ...groupFieldsFrom({ ...g, isPublished: true }),
        createdAt: now,
        updatedAt: now,
      })
      imported.push(name)
    }
    saveDictionary(dict)
    sendJson(res, 200, { imported, skipped })
    return
  }

  sendJson(res, 404, { error: 'not found' })
}

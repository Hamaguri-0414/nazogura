import { toBase } from './normalize'
import { validateElementName } from './validate'

export interface ParsedLine {
  lineNo: number
  raw: string
  ok: boolean
  error?: string
  groupName?: string
  elements?: string[]
}

/**
 * 一括インポートテキストのパース。
 * 形式: `グループ名: 要素, 要素, ...`（区切りは半角/全角コロン・カンマ、読点も可）
 * 空行は無視する。要素はカタカナ・英大文字を正規化した上でバリデーションする。
 */
export function parseImportText(text: string): ParsedLine[] {
  const results: ParsedLine[] = []

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNo = index + 1
    const raw = rawLine.trim()
    if (raw === '') return

    const sep = raw.search(/[:：]/)
    if (sep === -1) {
      results.push({ lineNo, raw, ok: false, error: '「グループ名: 要素, ...」の形式ではありません' })
      return
    }

    const groupName = raw.slice(0, sep).trim()
    if (groupName === '') {
      results.push({ lineNo, raw, ok: false, error: 'グループ名が空です' })
      return
    }

    const elements = raw
      .slice(sep + 1)
      .split(/[,、，]/)
      .map((e) => toBase(e.trim()))
      .filter((e) => e !== '')
    if (elements.length === 0) {
      results.push({ lineNo, raw, ok: false, error: '要素がありません' })
      return
    }

    for (const el of elements) {
      const err = validateElementName(el)
      if (err !== null) {
        results.push({ lineNo, raw, ok: false, error: `要素「${el}」: ${err}` })
        return
      }
    }

    results.push({ lineNo, raw, ok: true, groupName, elements })
  })

  return results
}

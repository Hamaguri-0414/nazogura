import type { Group } from './types'
import { normalizeForSearch } from './normalize'
import { maxMatchingSize } from './matching'

export interface ComposeOptions {
  /** 濁点・半濁点・小書き文字を区別しない */
  ignoreVariants: boolean
  /** 同一要素から2文字以上拾うことを許可する */
  allowMultiPick: boolean
}

export interface GroupMatcher {
  /** 正規化済みの単語（1文字ずつの配列）がこのグループから構成できるか */
  canCompose: (wordChars: string[]) => boolean
}

/** 単語を判定用に正規化する（1文字ずつの配列にする） */
export function normalizeWord(word: string, ignoreVariants: boolean): string[] {
  return [...word].map((ch) => normalizeForSearch(ch, ignoreVariants))
}

/**
 * グループに対する「作れる単語」判定器を作る。
 * 大量の単語を同一グループで判定するため、要素の正規化と文字集合を前計算しておく。
 */
export function createGroupMatcher(group: Group, options: ComposeOptions): GroupMatcher {
  const elementChars = group.elements.map((el) =>
    [...el].map((ch) => normalizeForSearch(ch, options.ignoreVariants)),
  )
  const charSet = new Set<string>(elementChars.flat())
  const elementCount = group.elements.length

  const canCompose = (wordChars: string[]): boolean => {
    // 事前フィルタ: 語長超過（複数拾いOFF時）と、グループに無い文字を含む場合は即除外
    if (!options.allowMultiPick && wordChars.length > elementCount) return false
    for (const ch of wordChars) {
      if (!charSet.has(ch)) return false
    }
    // 複数拾いOKなら「全文字がどこかの要素にある」＝charSet判定で確定
    if (options.allowMultiPick) return true

    const candidates = wordChars.map((ch) =>
      elementChars.flatMap((chars, j) => (chars.includes(ch) ? [j] : [])),
    )
    return maxMatchingSize(candidates, elementCount) === wordChars.length
  }

  return { canCompose }
}

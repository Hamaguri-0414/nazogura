/**
 * アナグラム全暗記ページのロジック。
 * 辞書の中から「文字の並べ替えで別の単語になる」組をすべて洗い出す。
 */

import { sortKey } from './anagram'

/** 調査対象とする最小文字数（日英共通） */
export const MIN_LIST_WORD_LENGTH = 4

export interface AnagramGroup {
  /** 文字構成キー（ソート済み文字列。組の同一性を表す） */
  key: string
  /** 同じ文字構成の単語（辞書順・重複なし・2語以上） */
  words: string[]
}

/** 組に含まれる単語の文字数 */
export function groupLength(group: AnagramGroup): number {
  return [...group.key].length
}

/**
 * 単語リストからアナグラムの組をすべて洗い出す。
 * minLength文字以上の単語を対象に、同じ文字構成の単語が2語以上ある組だけを返す。
 * 同じ組は1つにまとめる（A,BとB,Aを別々に数えない）ため、
 * 3語以上が同じ構成なら1つの組として全語が並ぶ。
 * 並び順は「文字数の昇順 → 先頭単語の辞書順」。
 */
export function buildAnagramGroups(
  words: string[],
  minLength: number = MIN_LIST_WORD_LENGTH,
): AnagramGroup[] {
  const byKey = new Map<string, Set<string>>()
  for (const word of words) {
    if ([...word].length < minLength) continue
    const key = sortKey(word)
    const set = byKey.get(key)
    if (set) {
      set.add(word)
    } else {
      byKey.set(key, new Set([word]))
    }
  }
  const groups: AnagramGroup[] = []
  for (const [key, set] of byKey) {
    if (set.size >= 2) {
      groups.push({ key, words: [...set].sort() })
    }
  }
  groups.sort(
    (a, b) =>
      groupLength(a) - groupLength(b) || a.words[0].localeCompare(b.words[0], 'ja'),
  )
  return groups
}

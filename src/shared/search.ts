import type { Group } from './types'
import { normalizeForSearch, toBase } from './normalize'
import { maxMatchingSize } from './matching'

export interface SearchOptions {
  /** 拾えない文字を何文字まで許容するか */
  allowedMisses: number
  /** 濁点・半濁点・小書き文字を区別しない */
  ignoreVariants: boolean
  /** 同一要素から2文字以上拾うことを許可する */
  allowMultiPick: boolean
}

export interface CharPick {
  /** 答えの文字（入力されたままの表記） */
  char: string
  matched: boolean
  /** 拾い元の要素のindex（グループ内の並び順） */
  elementIndex?: number
  /** 要素内の何文字目か（0始まり） */
  charIndexInElement?: number
  /** 濁点・小書き等の読み替えなしで一致しているか */
  exact?: boolean
}

/** 1通りの拾い方 */
export interface PickCombo {
  picks: CharPick[]
  /** 読み替え（濁点・小書き等の同一視）に頼った拾いの数。0なら区別しても成立する */
  fuzzyCount: number
}

export interface ThemeMatch {
  group: Group
  /** 拾い方の候補。読み替えの少ない順（先頭が代表） */
  combos: PickCombo[]
  /** 上限打ち切りで combos が全パターンではない場合 true */
  combosTruncated: boolean
  missCount: number
}

/** 1グループあたりの拾い方の列挙上限 */
const COMBO_LIMIT = 20
/** 列挙DFSの探索ノード数上限（暴走防止） */
const SEARCH_STEP_LIMIT = 20000

/** 元の文字位置との対応を保つため1文字ずつ正規化する */
function normalizeChars(text: string, ignoreVariants: boolean): string[] {
  return [...text].map((ch) => normalizeForSearch(ch, ignoreVariants))
}

/**
 * マッチ数が target になる割り当て（答えの文字ごとの拾い元要素、-1は未マッチ）を列挙する。
 * COMBO_LIMIT 件で打ち切り、打ち切ったかどうかを返す。
 */
function enumerateAssignments(
  candidates: number[][],
  target: number,
  allowMultiPick: boolean,
): { assignments: number[][]; truncated: boolean } {
  const len = candidates.length
  const assignments: number[][] = []
  const used = new Set<number>()
  const current: number[] = []
  let steps = 0
  let truncated = false

  const dfs = (i: number, matched: number): void => {
    if (truncated) return
    if (++steps > SEARCH_STEP_LIMIT) {
      truncated = true
      return
    }
    if (i === len) {
      if (matched === target) {
        assignments.push([...current])
        if (assignments.length >= COMBO_LIMIT) truncated = true
      }
      return
    }
    // 残り全部拾えても target に届かないなら枝刈り
    if (matched + (len - i) < target) return

    for (const j of candidates[i]) {
      if (!allowMultiPick && used.has(j)) continue
      current.push(j)
      if (!allowMultiPick) used.add(j)
      dfs(i + 1, matched + 1)
      current.pop()
      if (!allowMultiPick) used.delete(j)
      if (truncated) return
    }
    // この文字を拾わない選択肢
    current.push(-1)
    dfs(i + 1, matched)
    current.pop()
  }

  dfs(0, 0)
  return { assignments, truncated }
}

/**
 * 答えの単語を「グループ内の要素から1文字ずつ拾う」ことで構成できるテーマを検索する。
 * 各テーマについて拾い方を列挙し、読み替え（濁点・小書き等の同一視）が少ない
 * 組み合わせを優先して返す。
 */
export function searchThemes(
  groups: Group[],
  answer: string,
  options: SearchOptions,
): ThemeMatch[] {
  const answerChars = [...answer]
  const searchAnswer = normalizeChars(answer, options.ignoreVariants)
  const strictAnswer = normalizeChars(answer, false)
  if (searchAnswer.length === 0) return []

  const results: ThemeMatch[] = []

  for (const group of groups) {
    if (!group.isPublished) continue

    const searchElements = group.elements.map((el) =>
      normalizeChars(el, options.ignoreVariants),
    )
    const strictElements = group.elements.map((el) => [...toBase(el)])

    // 答えの各文字について、その文字を含む要素の一覧を作る
    const candidates: number[][] = searchAnswer.map((ch) =>
      searchElements.flatMap((chars, j) => (chars.includes(ch) ? [j] : [])),
    )

    const matchable = options.allowMultiPick
      ? candidates.filter((cand) => cand.length > 0).length
      : maxMatchingSize(candidates, group.elements.length)
    const missCount = searchAnswer.length - matchable
    if (missCount > options.allowedMisses) continue

    const { assignments, truncated } = enumerateAssignments(
      candidates,
      matchable,
      options.allowMultiPick,
    )

    const combos: PickCombo[] = assignments.map((assignment) => {
      let fuzzyCount = 0
      const picks: CharPick[] = assignment.map((j, i) => {
        if (j === -1) return { char: answerChars[i], matched: false }
        // 拾う位置は、読み替えなしで一致する位置を優先する
        const strictIndex = strictElements[j].findIndex(
          (ch, k) => ch === strictAnswer[i] && searchElements[j][k] === searchAnswer[i],
        )
        const exact = strictIndex !== -1
        if (!exact) fuzzyCount++
        return {
          char: answerChars[i],
          matched: true,
          elementIndex: j,
          charIndexInElement: exact
            ? strictIndex
            : searchElements[j].indexOf(searchAnswer[i]),
          exact,
        }
      })
      return { picks, fuzzyCount }
    })

    // 読み替えなしで成立する組み合わせを先頭に（安定ソートで列挙順は保たれる）
    combos.sort((a, b) => a.fuzzyCount - b.fuzzyCount)

    results.push({ group, combos, combosTruncated: truncated, missCount })
  }

  results.sort(
    (a, b) =>
      a.missCount - b.missCount ||
      a.group.name.localeCompare(b.group.name, 'ja'),
  )
  return results
}

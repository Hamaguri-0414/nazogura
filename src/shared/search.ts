import type { Group } from './types'
import { normalizeForSearch } from './normalize'

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
}

export interface ThemeMatch {
  group: Group
  picks: CharPick[]
  missCount: number
}

/** 要素の各文字を正規化した配列（元の文字位置との対応を保つため1文字ずつ変換） */
function normalizeChars(text: string, ignoreVariants: boolean): string[] {
  return [...text].map((ch) => normalizeForSearch(ch, ignoreVariants))
}

/**
 * 答えの単語を「グループ内の要素から1文字ずつ拾う」ことで構成できるテーマを検索する。
 * allowMultiPick=false のときは「答えの文字 × 要素」の二部グラフの最大マッチングで判定する。
 */
export function searchThemes(
  groups: Group[],
  answer: string,
  options: SearchOptions,
): ThemeMatch[] {
  const answerChars = [...answer]
  const normAnswer = normalizeChars(answer, options.ignoreVariants)
  if (normAnswer.length === 0) return []

  const results: ThemeMatch[] = []

  for (const group of groups) {
    if (!group.isPublished) continue

    const normElements = group.elements.map((el) =>
      normalizeChars(el, options.ignoreVariants),
    )

    // 答えの各文字について、その文字を含む要素の一覧を作る
    const candidates: number[][] = normAnswer.map((ch) =>
      normElements.flatMap((chars, j) => (chars.includes(ch) ? [j] : [])),
    )

    // 答えの各文字の拾い元要素（-1 は未マッチ）
    let assignment: number[]

    if (options.allowMultiPick) {
      // 同一要素からの複数拾いOK: 含む要素があれば先頭のものを拾う
      assignment = candidates.map((cand) => (cand.length > 0 ? cand[0] : -1))
    } else {
      // 1要素1文字まで: 増加路探索による最大マッチング
      const elementOwner = new Array<number>(group.elements.length).fill(-1)
      const tryAssign = (i: number, visited: boolean[]): boolean => {
        for (const j of candidates[i]) {
          if (visited[j]) continue
          visited[j] = true
          if (elementOwner[j] === -1 || tryAssign(elementOwner[j], visited)) {
            elementOwner[j] = i
            return true
          }
        }
        return false
      }
      for (let i = 0; i < normAnswer.length; i++) {
        tryAssign(i, new Array(group.elements.length).fill(false))
      }
      assignment = new Array<number>(normAnswer.length).fill(-1)
      elementOwner.forEach((i, j) => {
        if (i !== -1) assignment[i] = j
      })
    }

    const picks: CharPick[] = assignment.map((j, i) => {
      if (j === -1) return { char: answerChars[i], matched: false }
      return {
        char: answerChars[i],
        matched: true,
        elementIndex: j,
        charIndexInElement: normElements[j].indexOf(normAnswer[i]),
      }
    })
    const missCount = picks.filter((p) => !p.matched).length

    if (missCount <= options.allowedMisses) {
      results.push({ group, picks, missCount })
    }
  }

  results.sort(
    (a, b) =>
      a.missCount - b.missCount ||
      a.group.name.localeCompare(b.group.name, 'ja'),
  )
  return results
}

/**
 * 五十音シフトトレーニングのロジック。
 * 五十音表の上で文字を段・行方向にずらす変換を扱う。
 */
import { GOJUON_COLUMNS } from './kanaTraining'

/** 仮名 → 五十音表上の位置（col: 行のindex、row: 段のindex） */
const KANA_POS = new Map<string, { col: number; row: number }>()
GOJUON_COLUMNS.forEach((column, col) => {
  column.forEach((kana, row) => {
    if (kana !== null) KANA_POS.set(kana, { col, row })
  })
})

export interface ShiftRule {
  id: string
  /** 行方向の移動量（あ行→か行 が +1） */
  colDelta: number
  /** 段方向の移動量（あ段→い段 が +1） */
  rowDelta: number
  /** 例示（あ→い 形式）。解き手にはこれを提示する */
  example: string
  /** 補足説明 */
  label: string
}

/** 出題に使うシフトルール。解き手は出題文字列にこの変換を適用する */
export const SHIFT_RULES: ShiftRule[] = [
  { id: 'row+1', colDelta: 0, rowDelta: 1, example: 'あ→い', label: '1段下へ' },
  { id: 'row-1', colDelta: 0, rowDelta: -1, example: 'い→あ', label: '1段上へ' },
  { id: 'col+1', colDelta: 1, rowDelta: 0, example: 'あ→か', label: '次の行へ' },
  { id: 'col-1', colDelta: -1, rowDelta: 0, example: 'か→あ', label: '前の行へ' },
]

/**
 * 1文字をシフトする。移動先が表の外や欠けマスなら null。
 * 折り返し（お→あ 等）はしない。
 */
export function shiftChar(char: string, colDelta: number, rowDelta: number): string | null {
  const pos = KANA_POS.get(char)
  if (pos === undefined) return null
  const column = GOJUON_COLUMNS[pos.col + colDelta]
  if (column === undefined) return null
  const row = pos.row + rowDelta
  if (row < 0 || row > 4) return null
  return column[row]
}

/** 単語全体をシフトする。1文字でもシフトできなければ null */
export function shiftWord(word: string, colDelta: number, rowDelta: number): string | null {
  let out = ''
  for (const char of word) {
    const shifted = shiftChar(char, colDelta, rowDelta)
    if (shifted === null) return null
    out += shifted
  }
  return out
}

/**
 * 答えの単語に対して出題可能なルールを返す。
 * 出題文字列は答えを逆方向にシフトしたものなので、逆シフトが成立する必要がある。
 */
export function encodableRules(word: string): ShiftRule[] {
  return SHIFT_RULES.filter(
    (rule) => shiftWord(word, -rule.colDelta, -rule.rowDelta) !== null,
  )
}

export const MIN_SHIFT_WORD_LENGTH = 3
export const MAX_SHIFT_WORD_LENGTH = 5

/**
 * 出題に使える単語だけを抜き出す。
 * 五十音表に置ける文字のみの3〜5文字で、いずれかのルールで出題できること。
 */
export function filterShiftWords(words: string[]): string[] {
  return words.filter((word) => {
    const chars = [...word]
    if (chars.length < MIN_SHIFT_WORD_LENGTH || chars.length > MAX_SHIFT_WORD_LENGTH) {
      return false
    }
    if (!chars.every((c) => KANA_POS.has(c))) return false
    return encodableRules(word).length > 0
  })
}

export interface ShiftQuestion {
  /** 答え（辞書の単語） */
  answer: string
  /** 画面に出す変換前の文字列 */
  shown: string
  rule: ShiftRule
}

/** 単語と使用ルールから問題を組み立てる。ルールが不成立なら null */
export function makeShiftQuestion(answer: string, rule: ShiftRule): ShiftQuestion | null {
  const shown = shiftWord(answer, -rule.colDelta, -rule.rowDelta)
  if (shown === null) return null
  return { answer, shown, rule }
}

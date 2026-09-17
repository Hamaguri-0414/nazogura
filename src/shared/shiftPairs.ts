/**
 * 文字ずらし対応表のロジック。
 * 文字の並び（五十音順・アルファベット順）の上で単語全体を+nずらし、
 * 辞書内の別の単語になる組を全探索する。
 */

/** 五十音順の並び。末尾（ん）の次は先頭（あ）に折り返す */
export const KANA_SEQUENCE = [
  ...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
]

/** アルファベット順の並び。zの次はaに折り返す */
export const ALPHABET_SEQUENCE = [...'abcdefghijklmnopqrstuvwxyz']

export interface ShiftPair {
  /** 変換前の単語（辞書掲載語） */
  from: string
  /** 変換後の単語（辞書掲載語） */
  to: string
  /** ずらし数（常に 1 〜 floor(並び長/2)） */
  shift: number
}

/** 並びの各文字 → index の対応表を作る */
function indexOf(sequence: string[]): Map<string, number> {
  return new Map(sequence.map((char, i) => [char, i]))
}

/**
 * 単語全体を並びの上で+nずらす（折り返しあり）。
 * 並びにない文字を含む場合は null。
 */
export function shiftWordBy(
  word: string,
  n: number,
  sequence: string[],
  index: Map<string, number> = indexOf(sequence),
): string | null {
  const mod = sequence.length
  let out = ''
  for (const char of word) {
    const i = index.get(char)
    if (i === undefined) return null
    out += sequence[(((i + n) % mod) + mod) % mod]
  }
  return out
}

export const MIN_PAIR_WORD_LENGTH = 2

/**
 * 前半と後半が同じ繰り返し語（からから、うとうと 等）か判定する。
 * オノマトペの大半がこの形。ずらし変換は繰り返し構造を保存するため、
 * 組の片側がこの形なら反対側も必ずこの形になる。
 */
export function isRepeatedWord(word: string): boolean {
  const chars = [...word]
  if (chars.length % 2 !== 0) return false
  const half = chars.length / 2
  for (let i = 0; i < half; i++) {
    if (chars[i] !== chars[i + half]) return false
  }
  return true
}

/**
 * 辞書内の全単語について、+nずらしで辞書内の別の単語になる組を列挙する。
 * A→B（+n）とB→A（+(mod-n)）は同じ組なので、ずらし数が小さい方の向きだけを
 * 採用する（n = mod/2 で並ぶ場合は from が並び順で先の向き）。
 * 対象は、並びに含まれる文字のみからなる2文字以上の単語。
 */
export function findShiftPairs(words: string[], sequence: string[]): ShiftPair[] {
  const index = indexOf(sequence)
  const mod = sequence.length
  const half = Math.floor(mod / 2)
  const eligible = words.filter((w) => {
    const chars = [...w]
    return chars.length >= MIN_PAIR_WORD_LENGTH && chars.every((c) => index.has(c))
  })
  const dict = new Set(eligible)
  const pairs: ShiftPair[] = []
  for (const from of dict) {
    for (let n = 1; n <= half; n++) {
      const to = shiftWordBy(from, n, sequence, index)
      if (to === null || !dict.has(to)) continue
      // 折り返しのちょうど半分では両向きが同じずらし数になるため片側だけ採用
      if (n * 2 === mod && from > to) continue
      pairs.push({ from, to, shift: n })
    }
  }
  return pairs.sort(
    (a, b) =>
      a.shift - b.shift ||
      [...b.from].length - [...a.from].length ||
      a.from.localeCompare(b.from, 'ja'),
  )
}

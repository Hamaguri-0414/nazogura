/**
 * 五十音文字拾いトレーニングのロジック。
 * 五十音表のマスに丸数字を置き、順に拾って単語を導く問題を扱う。
 */

/**
 * 五十音表の列（あ行〜わ行＋ん）。表示時は右端があ行になる。
 * null は表に存在しないマス（や行・わ行の欠け）。
 */
export const GOJUON_COLUMNS: (string | null)[][] = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', null, 'ゆ', null, 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', null, null, null, 'を'],
  ['ん', null, null, null, null],
]

/** 五十音表に置ける仮名の集合 */
const GRID_KANA = new Set(
  GOJUON_COLUMNS.flat().filter((c): c is string => c !== null),
)

export const MIN_WORD_LENGTH = 4
export const MAX_WORD_LENGTH = 7

/**
 * 出題に使える単語か判定する。
 * 五十音表のマスに直接置ける文字（清音・並字）のみで構成された
 * 4〜7文字の単語に限る（濁点・半濁点・小書き・長音は不可）。
 */
export function isTrainingWord(word: string): boolean {
  const chars = [...word]
  if (chars.length < MIN_WORD_LENGTH || chars.length > MAX_WORD_LENGTH) {
    return false
  }
  return chars.every((c) => GRID_KANA.has(c))
}

/** 単語リストから出題に使える単語だけを抜き出す */
export function filterTrainingWords(words: string[]): string[] {
  return words.filter(isTrainingWord)
}

/**
 * 単語の各文字に丸数字（1始まり）を割り当て、仮名ごとの番号一覧を返す。
 * 同じ文字が複数回現れる場合、そのマスには複数の番号が並ぶ。
 */
export function marksFor(word: string): Map<string, number[]> {
  const marks = new Map<string, number[]>()
  ;[...word].forEach((char, i) => {
    const list = marks.get(char)
    if (list) list.push(i + 1)
    else marks.set(char, [i + 1])
  })
  return marks
}

/** 丸数字（①〜）の文字を返す。1〜20まで対応 */
export function circledNumber(n: number): string {
  return String.fromCodePoint(0x2460 + n - 1)
}

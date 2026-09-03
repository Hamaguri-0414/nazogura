/** 小書き文字 → 並字 の対応表 */
const SMALL_TO_LARGE: Record<string, string> = {
  ぁ: 'あ',
  ぃ: 'い',
  ぅ: 'う',
  ぇ: 'え',
  ぉ: 'お',
  ゃ: 'や',
  ゅ: 'ゆ',
  ょ: 'よ',
  っ: 'つ',
  ゎ: 'わ',
  ゕ: 'か',
  ゖ: 'け',
}

/**
 * 常時行う正規化: カタカナ→ひらがな、ASCII英大文字→小文字。
 * 長音「ー」は通常の1文字としてそのまま残す。
 */
export function toBase(input: string): string {
  let out = ''
  for (const ch of input.toLowerCase()) {
    const code = ch.codePointAt(0)!
    // カタカナ ァ(30A1)〜ヶ(30F6) → ひらがな（-0x60）
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60)
    } else {
      out += ch
    }
  }
  return out
}

/**
 * 小書き文字を並字に揃える。単語辞書は拗音・促音を並字で収録している
 * （例: 煎茶 → せんちや）ため、辞書の単語と突き合わせる入力に使う。
 */
export function toLargeKana(input: string): string {
  let out = ''
  for (const ch of input) {
    out += SMALL_TO_LARGE[ch] ?? ch
  }
  return out
}

/**
 * 「表記ゆれを区別しない」オプション用の正規化。
 * 濁点・半濁点を除去し、小書き文字を並字に揃える。
 * toBase 済みの文字列を渡すこと。
 */
export function toFuzzy(input: string): string {
  const stripped = input
    .normalize('NFD')
    .replace(/[゙゚]/g, '') // 結合用の濁点・半濁点
    .normalize('NFC')
  let out = ''
  for (const ch of stripped) {
    out += SMALL_TO_LARGE[ch] ?? ch
  }
  return out
}

/** 検索用の正規化（1文字ずつ適用しても同じ結果になる） */
export function normalizeForSearch(input: string, ignoreVariants: boolean): string {
  const base = toBase(input)
  return ignoreVariants ? toFuzzy(base) : base
}

/** 元の文字位置との対応を保つため、1文字ずつ検索用に正規化して配列にする */
export function normalizeChars(text: string, ignoreVariants: boolean): string[] {
  return [...text].map((ch) => normalizeForSearch(ch, ignoreVariants))
}

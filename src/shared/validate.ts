// ひらがな ぁ(3041)〜ゖ(3096) + 長音「ー」
const HIRAGANA_RE = /^[ぁ-ゖー]+$/u
const ALPHA_RE = /^[a-z]+$/

/**
 * 要素名のバリデーション。
 * ひらがなのみ、または半角英字（小文字）のみを許可する。
 * 正常なら null、不正ならエラーメッセージを返す。
 */
export function validateElementName(name: string): string | null {
  if (name.length === 0) {
    return '要素が空です'
  }
  if (HIRAGANA_RE.test(name) || ALPHA_RE.test(name)) {
    return null
  }
  return 'ひらがなのみ、または半角英字のみで入力してください'
}

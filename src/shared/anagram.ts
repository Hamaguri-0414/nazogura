/**
 * アナグラムトレーニングのロジック。
 * 辞書の単語をシャッフルして出題し、並べ替えて単語に戻してもらう。
 */

export const MIN_ANAGRAM_LENGTH = 4
export const MAX_ANAGRAM_LENGTH = 7

/** 文字の構成（マルチセット）を比較するためのキー */
export function sortKey(word: string): string {
  return [...word].sort().join('')
}

/**
 * 出題に使える単語か判定する。4〜7文字で、
 * 並べ替えが成立するよう2種類以上の文字を含むこと。
 */
export function isAnagramWord(word: string): boolean {
  const chars = [...word]
  if (chars.length < MIN_ANAGRAM_LENGTH || chars.length > MAX_ANAGRAM_LENGTH) {
    return false
  }
  return new Set(chars).size >= 2
}

/** 単語リストから出題に使える単語だけを抜き出す */
export function filterAnagramWords(words: string[]): string[] {
  return words.filter(isAnagramWord)
}

/**
 * 単語の文字をシャッフルする。元の並びと同じにならないよう引き直す
 * （2種類以上の文字を含む前提。念のため試行回数は抑える）。
 */
export function shuffleWord(word: string, random: () => number = Math.random): string {
  const chars = [...word]
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    const shuffled = chars.join('')
    if (shuffled !== word) return shuffled
  }
  return chars.join('')
}

/**
 * 解答が正解か判定する。出題単語と同じ文字構成で、
 * かつ辞書に載っている単語なら、出題単語と違っていても正解（別解を許容）。
 */
export function isAnagramAnswer(
  target: string,
  answer: string,
  dictionary: Set<string>,
): boolean {
  return sortKey(answer) === sortKey(target) && dictionary.has(answer)
}

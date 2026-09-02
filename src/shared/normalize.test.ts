import { describe, expect, it } from 'vitest'
import { normalizeForSearch, toBase, toFuzzy } from './normalize'

describe('toBase', () => {
  it('カタカナをひらがなに変換する', () => {
    expect(toBase('ヒカリ')).toBe('ひかり')
    expect(toBase('ヴ')).toBe('ゔ')
  })

  it('英大文字を小文字に変換する', () => {
    expect(toBase('DoReMi')).toBe('doremi')
  })

  it('長音「ー」はそのまま残す', () => {
    expect(toBase('コーヒー')).toBe('こーひー')
  })
})

describe('toFuzzy', () => {
  it('濁点・半濁点を除去する', () => {
    expect(toFuzzy('がぎぱぴ')).toBe('かきはひ')
  })

  it('小書き文字を並字にする', () => {
    expect(toFuzzy('きょっゎ')).toBe('きよつわ')
  })

  it('ゔは「う」になる', () => {
    expect(toFuzzy('ゔ')).toBe('う')
  })
})

describe('normalizeForSearch', () => {
  it('区別あり: 濁点は残る', () => {
    expect(normalizeForSearch('ガッキュウ', false)).toBe('がっきゅう')
  })

  it('区別なし: 濁点・小書きも同一視される', () => {
    expect(normalizeForSearch('ガッキュウ', true)).toBe('かつきゆう')
  })
})

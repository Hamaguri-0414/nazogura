import { describe, expect, it } from 'vitest'
import {
  filterAnagramWords,
  isAnagramAnswer,
  shuffleWord,
  sortKey,
} from './anagram'

describe('sortKey', () => {
  it('文字構成が同じなら同じキーになる', () => {
    expect(sortKey('とけい')).toBe(sortKey('いけと'))
    expect(sortKey('とけい')).not.toBe(sortKey('とけいや'))
  })
})

describe('filterAnagramWords', () => {
  it('4〜7文字で2種類以上の文字を含む単語に絞る', () => {
    expect(
      filterAnagramWords(['ひまわり', 'あじさい', 'ばら', 'ああああ', 'らーめんてんちょう']),
    ).toEqual(['ひまわり', 'あじさい'])
  })
})

describe('shuffleWord', () => {
  it('文字構成を保ったまま元と違う並びを返す', () => {
    // 固定シードの代わりに複数回検証する
    for (let i = 0; i < 20; i++) {
      const shuffled = shuffleWord('あいうえお')
      expect(shuffled).not.toBe('あいうえお')
      expect(sortKey(shuffled)).toBe(sortKey('あいうえお'))
    }
  })
})

describe('isAnagramAnswer', () => {
  const dict = new Set(['とけい', 'いけと', 'たいこ'])

  it('出題単語そのものは正解', () => {
    expect(isAnagramAnswer('とけい', 'とけい', dict)).toBe(true)
  })

  it('同じ文字構成の別の辞書単語も正解（別解許容）', () => {
    expect(isAnagramAnswer('とけい', 'いけと', dict)).toBe(true)
  })

  it('辞書にない並びや文字構成違いは不正解', () => {
    expect(isAnagramAnswer('とけい', 'けいと', dict)).toBe(false) // 辞書にない
    expect(isAnagramAnswer('とけい', 'たいこ', dict)).toBe(false) // 構成違い
  })
})

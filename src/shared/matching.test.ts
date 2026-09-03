import { describe, expect, it } from 'vitest'
import { buildCandidates, maxMatchingSize } from './matching'

describe('buildCandidates', () => {
  it('各文字を含む要素indexを列挙する', () => {
    const elements = [
      ['あ', 'か'],
      ['か', 'き'],
      ['さ'],
    ]
    expect(buildCandidates(['か', 'さ', 'ん'], elements)).toEqual([[0, 1], [2], []])
  })

  it('空の入力では空の候補になる', () => {
    expect(buildCandidates([], [['あ']])).toEqual([])
    expect(buildCandidates(['あ'], [])).toEqual([[]])
  })
})

describe('maxMatchingSize', () => {
  it('候補が空の頂点はマッチしない', () => {
    expect(maxMatchingSize([[], [0]], 1)).toBe(1)
  })

  it('頂点も要素もない場合は0', () => {
    expect(maxMatchingSize([], 0)).toBe(0)
  })

  it('増加路の付け替えで最大マッチングを見つける', () => {
    // 0番が[0,1]、1番が[0]のみ → 0番を1に付け替えて2マッチ
    expect(maxMatchingSize([[0, 1], [0]], 2)).toBe(2)
  })

  it('要素数より多い文字はマッチしきれない', () => {
    expect(maxMatchingSize([[0], [0], [0]], 1)).toBe(1)
  })

  it('候補の並び順はマッチングサイズに影響しない', () => {
    expect(maxMatchingSize([[1, 0], [0]], 2)).toBe(maxMatchingSize([[0, 1], [0]], 2))
  })
})

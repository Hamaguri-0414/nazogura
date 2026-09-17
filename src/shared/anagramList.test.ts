import { describe, expect, it } from 'vitest'
import { buildAnagramGroups, groupLength } from './anagramList'

describe('buildAnagramGroups', () => {
  it('同じ文字構成の単語を1つの組にまとめる（A,BとB,Aは重複しない）', () => {
    const groups = buildAnagramGroups(['とけいや', 'やけいと', 'たいこもち'])
    expect(groups).toHaveLength(1)
    expect(groups[0].words).toEqual(['とけいや', 'やけいと'])
  })

  it('3語以上でも1つの組にまとめる', () => {
    const groups = buildAnagramGroups(['stop', 'spot', 'post', 'stay'])
    expect(groups).toHaveLength(1)
    expect(groups[0].words).toEqual(['post', 'spot', 'stop'])
  })

  it('4文字未満の単語は調査対象にしない', () => {
    expect(buildAnagramGroups(['とけい', 'いけと'])).toEqual([])
  })

  it('相方がいない単語は組にならない', () => {
    expect(buildAnagramGroups(['ひまわり', 'あじさい'])).toEqual([])
  })

  it('重複した単語は1語として扱う', () => {
    expect(buildAnagramGroups(['stop', 'stop'])).toEqual([])
  })

  it('文字数の昇順、同文字数では先頭単語の辞書順に並ぶ', () => {
    const groups = buildAnagramGroups([
      'めがねや',
      'やめがね',
      'かいだん',
      'だんかい',
      'たんぽぽけん',
      'けんたんぽぽ',
    ])
    expect(groups.map((g) => g.words[0])).toEqual([
      'かいだん',
      'めがねや',
      'けんたんぽぽ',
    ])
    expect(groups.map((g) => groupLength(g))).toEqual([4, 4, 6])
  })
})

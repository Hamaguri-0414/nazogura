import { describe, expect, it } from 'vitest'
import {
  ALPHABET_SEQUENCE,
  KANA_SEQUENCE,
  findShiftPairs,
  isRepeatedWord,
  shiftWordBy,
} from './shiftPairs'

describe('isRepeatedWord', () => {
  it('前半＝後半の繰り返し語を判定する', () => {
    expect(isRepeatedWord('からから')).toBe(true)
    expect(isRepeatedWord('ああ')).toBe(true)
    expect(isRepeatedWord('haha')).toBe(true)
  })

  it('繰り返しでない単語・奇数文字の単語は該当しない', () => {
    expect(isRepeatedWord('あたま')).toBe(false)
    expect(isRepeatedWord('ちちはは')).toBe(false)
    expect(isRepeatedWord('あか')).toBe(false)
  })
})

describe('shiftWordBy', () => {
  it('五十音順で+3ずらす（いちみ→おとも）', () => {
    expect(shiftWordBy('いちみ', 3, KANA_SEQUENCE)).toBe('おとも')
  })

  it('末尾から先頭へ折り返す（ん+1→あ、を+2→あ）', () => {
    expect(shiftWordBy('んを', 1, KANA_SEQUENCE)).toBe('あん')
    expect(shiftWordBy('を', 2, KANA_SEQUENCE)).toBe('あ')
  })

  it('マイナスのずらしも折り返す（あ-1→ん）', () => {
    expect(shiftWordBy('あ', -1, KANA_SEQUENCE)).toBe('ん')
  })

  it('並びにない文字（濁点・長音など）を含む場合はnull', () => {
    expect(shiftWordBy('がーど', 1, KANA_SEQUENCE)).toBeNull()
  })

  it('アルファベット順でもずらせる（add+1→bee）', () => {
    expect(shiftWordBy('add', 1, ALPHABET_SEQUENCE)).toBe('bee')
    expect(shiftWordBy('zoo', 1, ALPHABET_SEQUENCE)).toBe('app')
  })
})

describe('findShiftPairs', () => {
  it('辞書内で+nずらしが成立する組を見つける', () => {
    const pairs = findShiftPairs(['いちみ', 'おとも', 'すいか'], KANA_SEQUENCE)
    expect(pairs).toEqual([{ from: 'いちみ', to: 'おとも', shift: 3 }])
  })

  it('逆向き（+43）ではなくずらし数が小さい向きだけを採用する', () => {
    const pairs = findShiftPairs(['おとも', 'いちみ'], KANA_SEQUENCE)
    expect(pairs).toEqual([{ from: 'いちみ', to: 'おとも', shift: 3 }])
  })

  it('ずらし数がちょうど半分の組は片側だけ採用する', () => {
    // a+13=n, d+13=q
    const pairs = findShiftPairs(['ad', 'nq'], ALPHABET_SEQUENCE)
    expect(pairs).toEqual([{ from: 'ad', to: 'nq', shift: 13 }])
  })

  it('1文字の単語と並びにない文字を含む単語は対象外', () => {
    const pairs = findShiftPairs(['い', 'お', 'がち'], KANA_SEQUENCE)
    expect(pairs).toEqual([])
  })

  it('ずらし数→文字数（降順）→並び順でソートされる', () => {
    const pairs = findShiftPairs(
      ['あか', 'いき', 'あたま', 'いちみ', 'おとも'],
      KANA_SEQUENCE,
    )
    expect(pairs).toEqual([
      { from: 'あたま', to: 'いちみ', shift: 1 },
      { from: 'あか', to: 'いき', shift: 1 },
      { from: 'いちみ', to: 'おとも', shift: 3 },
      { from: 'あたま', to: 'おとも', shift: 4 },
    ])
  })
})

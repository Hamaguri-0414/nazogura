import { describe, expect, it } from 'vitest'
import {
  GOJUON_COLUMNS,
  circledNumber,
  filterTrainingWords,
  isTrainingWord,
  marksFor,
} from './kanaTraining'

describe('GOJUON_COLUMNS', () => {
  it('11列×5段で、仮名の重複がない', () => {
    expect(GOJUON_COLUMNS).toHaveLength(11)
    for (const col of GOJUON_COLUMNS) {
      expect(col).toHaveLength(5)
    }
    const kana = GOJUON_COLUMNS.flat().filter((c) => c !== null)
    expect(new Set(kana).size).toBe(kana.length)
    expect(kana).toHaveLength(46)
  })
})

describe('isTrainingWord', () => {
  it('清音のみの4〜7文字を受け付ける', () => {
    expect(isTrainingWord('あさかい')).toBe(true)
    expect(isTrainingWord('かたつむり')).toBe(true)
    expect(isTrainingWord('わをんまみむめ')).toBe(true)
  })

  it('文字数が範囲外なら弾く', () => {
    expect(isTrainingWord('さくら')).toBe(false)
    expect(isTrainingWord('あいうえおかきく')).toBe(false)
  })

  it('五十音表に置けない文字を含む単語は弾く', () => {
    expect(isTrainingWord('らっぱのおと')).toBe(false) // 小書き
    expect(isTrainingWord('がっこう')).toBe(false) // 濁点
    expect(isTrainingWord('らーめんや')).toBe(false) // 長音
    expect(isTrainingWord('カタカナで')).toBe(false) // カタカナ
  })
})

describe('filterTrainingWords', () => {
  it('使える単語だけを残す', () => {
    expect(
      filterTrainingWords(['ひまわり', 'さくら', 'ばら', 'あさやけ', 'チューリップ']),
    ).toEqual(['ひまわり', 'あさやけ'])
  })
})

describe('marksFor', () => {
  it('各文字に1始まりの番号を割り当てる', () => {
    expect(marksFor('ひまわり')).toEqual(
      new Map([
        ['ひ', [1]],
        ['ま', [2]],
        ['わ', [3]],
        ['り', [4]],
      ]),
    )
  })

  it('同じ文字には番号が複数並ぶ', () => {
    expect(marksFor('かかしとか')).toEqual(
      new Map([
        ['か', [1, 2, 5]],
        ['し', [3]],
        ['と', [4]],
      ]),
    )
  })
})

describe('circledNumber', () => {
  it('丸数字を返す', () => {
    expect(circledNumber(1)).toBe('①')
    expect(circledNumber(7)).toBe('⑦')
  })
})

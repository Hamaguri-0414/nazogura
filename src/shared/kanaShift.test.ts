import { describe, expect, it } from 'vitest'
import {
  SHIFT_RULES,
  encodableRules,
  filterShiftWords,
  makeShiftQuestion,
  shiftChar,
  shiftWord,
} from './kanaShift'

const rule = (id: string) => SHIFT_RULES.find((r) => r.id === id)!

describe('shiftChar', () => {
  it('段方向にずらす', () => {
    expect(shiftChar('あ', 0, 1)).toBe('い')
    expect(shiftChar('い', 0, -1)).toBe('あ')
    expect(shiftChar('と', 0, -1)).toBe('て')
  })

  it('行方向にずらす', () => {
    expect(shiftChar('あ', 1, 0)).toBe('か')
    expect(shiftChar('か', -1, 0)).toBe('あ')
    expect(shiftChar('わ', 1, 0)).toBe('ん')
  })

  it('表の外・欠けマス・折り返しは null', () => {
    expect(shiftChar('お', 0, 1)).toBeNull() // お段の下はない
    expect(shiftChar('あ', 0, -1)).toBeNull() // あ段の上はない
    expect(shiftChar('ん', 1, 0)).toBeNull() // ん行の次はない
    expect(shiftChar('み', 1, 0)).toBeNull() // や行のい段は欠けマス
    expect(shiftChar('が', 0, 1)).toBeNull() // 表にない文字
  })
})

describe('shiftWord', () => {
  it('全文字をずらす', () => {
    expect(shiftWord('あかさ', 0, 1)).toBe('いきし')
  })

  it('1文字でも不成立なら null', () => {
    expect(shiftWord('あお', 0, 1)).toBeNull()
  })
})

describe('encodableRules / makeShiftQuestion', () => {
  it('出題は答えの逆シフトが成立するルールに限る', () => {
    // 答え「いきし」を段+1（あ→い）で出題すると、出題文字列は あかさ
    const rules = encodableRules('いきし').map((r) => r.id)
    expect(rules).toContain('row+1')
    const q = makeShiftQuestion('いきし', rule('row+1'))!
    expect(q.shown).toBe('あかさ')
    // 解き手が shown にルールを適用すると答えに戻る
    expect(shiftWord(q.shown, rule('row+1').colDelta, rule('row+1').rowDelta)).toBe(
      'いきし',
    )
  })

  it('不成立のルールでは null', () => {
    // 答え「あかさ」の段+1出題には あ段の上のマスが必要で不成立
    expect(makeShiftQuestion('あかさ', rule('row+1'))).toBeNull()
  })
})

describe('filterShiftWords', () => {
  it('3〜5文字・表内文字・出題可能ルールありに絞る', () => {
    expect(
      filterShiftWords(['いきし', 'がっこう', 'あい', 'かたつむりの', 'きしちにひ']),
    ).toEqual(['いきし', 'きしちにひ'])
  })
})

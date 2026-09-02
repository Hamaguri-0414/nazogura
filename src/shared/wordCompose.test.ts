import { describe, expect, it } from 'vitest'
import type { Group } from './types'
import { createGroupMatcher, normalizeWord } from './wordCompose'

function group(name: string, elements: string[]): Group {
  return {
    id: name,
    name,
    note: '',
    isPublished: true,
    elements,
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
  }
}

const fingers = group('指の名前', ['おや', 'ひとさし', 'なか', 'くすり', 'こ'])
const defaults = { ignoreVariants: true, allowMultiPick: false }

function can(g: Group, word: string, options = defaults): boolean {
  return createGroupMatcher(g, options).canCompose(
    normalizeWord(word, options.ignoreVariants),
  )
}

describe('createGroupMatcher', () => {
  it('構成できる単語を判定できる', () => {
    expect(can(fingers, 'ひかり')).toBe(true)
    expect(can(fingers, 'こな')).toBe(true)
  })

  it('グループに無い文字を含む単語は構成できない', () => {
    expect(can(fingers, 'ひかりん')).toBe(false)
  })

  it('複数拾いOFFでは同じ要素の文字を2回使えない', () => {
    const g = group('単一', ['ひとさし'])
    expect(can(g, 'ひと')).toBe(false)
    expect(can(g, 'ひと', { ...defaults, allowMultiPick: true })).toBe(true)
  })

  it('複数拾いOFFでは要素数を超える長さの単語は構成できない', () => {
    const g = group('2要素', ['あい', 'うえ'])
    expect(can(g, 'あいう')).toBe(false)
  })

  it('表記ゆれ: 区別しないなら濁点付きの単語も構成できる', () => {
    expect(can(fingers, 'ひがり')).toBe(true)
    expect(can(fingers, 'ひがり', { ...defaults, ignoreVariants: false })).toBe(false)
  })

  it('同じ文字を複数回使う単語は、別要素にあれば構成できる', () => {
    const g = group('か2つ', ['かき', 'かく'])
    expect(can(g, 'かか')).toBe(true)
    const g1 = group('か1つ', ['かき', 'くけ'])
    expect(can(g1, 'かか')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import type { Group } from './types'
import { searchThemes, type SearchOptions } from './search'

function group(name: string, elements: string[], isPublished = true): Group {
  return {
    id: name,
    name,
    category: 'テスト',
    note: '',
    isPublished,
    elements,
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  }
}

const fingers = group('指の名前', ['おや', 'ひとさし', 'なか', 'くすり', 'こ'])
const weekdays = group('曜日', ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'])

const defaults: SearchOptions = {
  allowedMisses: 0,
  ignoreVariants: true,
  allowMultiPick: false,
}

describe('searchThemes', () => {
  it('「ひかり」で指の名前が見つかり、拾い元も正しい', () => {
    const results = searchThemes([fingers, weekdays], 'ひかり', defaults)
    expect(results).toHaveLength(1)
    const { group: g, picks, missCount } = results[0]
    expect(g.name).toBe('指の名前')
    expect(missCount).toBe(0)
    expect(picks).toEqual([
      { char: 'ひ', matched: true, elementIndex: 1, charIndexInElement: 0 },
      { char: 'か', matched: true, elementIndex: 2, charIndexInElement: 1 },
      { char: 'り', matched: true, elementIndex: 3, charIndexInElement: 2 },
    ])
  })

  it('カタカナ入力でも同様に見つかる', () => {
    const results = searchThemes([fingers], 'ヒカリ', defaults)
    expect(results).toHaveLength(1)
  })

  it('同じ文字が2回必要な場合、別の要素から拾う', () => {
    // 「か」は なか(か) と か に含まれる
    const results = searchThemes([weekdays], 'かか', defaults)
    expect(results).toHaveLength(0)
    const withFingers = searchThemes([group('か2つ', ['かき', 'かく'])], 'かか', defaults)
    expect(withFingers).toHaveLength(1)
    const idx = withFingers[0].picks.map((p) => p.elementIndex)
    expect(new Set(idx).size).toBe(2)
  })

  it('増加路が必要なケースでも最大マッチングを見つける', () => {
    // 「あ」は要素0のみ、「い」は要素0と1に含まれる。
    // 「い」を先に要素0に割り当てると「あ」が拾えなくなるが、増加路で解決できる
    const g = group('増加路', ['あい', 'いう'])
    const results = searchThemes([g], 'いあ', defaults)
    expect(results).toHaveLength(1)
    expect(results[0].missCount).toBe(0)
  })

  it('許容0では「ひかりん」は見つからないが、許容1なら見つかる', () => {
    expect(searchThemes([fingers], 'ひかりん', defaults)).toHaveLength(0)
    const results = searchThemes([fingers], 'ひかりん', { ...defaults, allowedMisses: 1 })
    expect(results).toHaveLength(1)
    expect(results[0].missCount).toBe(1)
    expect(results[0].picks[3]).toEqual({ char: 'ん', matched: false })
  })

  it('表記ゆれ: 区別しないなら「ひがり」でも見つかる', () => {
    expect(searchThemes([fingers], 'ひがり', defaults)).toHaveLength(1)
    expect(
      searchThemes([fingers], 'ひがり', { ...defaults, ignoreVariants: false }),
    ).toHaveLength(0)
  })

  it('同一要素からの複数拾い: OFFでは不可、ONなら可', () => {
    // 「ひと」は どちらの文字も「ひとさし」に含まれる
    const g = group('単一要素', ['ひとさし'])
    expect(searchThemes([g], 'ひと', defaults)).toHaveLength(0)
    expect(
      searchThemes([g], 'ひと', { ...defaults, allowMultiPick: true }),
    ).toHaveLength(1)
  })

  it('非公開グループは検索対象外', () => {
    const hidden = { ...fingers, isPublished: false }
    expect(searchThemes([hidden], 'ひかり', defaults)).toHaveLength(0)
  })

  it('結果は未マッチ数の昇順で並ぶ', () => {
    const g1 = group('一部だけ', ['ひと'])
    const results = searchThemes([g1, fingers], 'ひかり', {
      ...defaults,
      allowedMisses: 2,
    })
    expect(results.map((r) => r.group.name)).toEqual(['指の名前', '一部だけ'])
  })

  it('半角英字の要素も検索できる', () => {
    const g = group('アルファベット', ['abc', 'def'])
    const results = searchThemes([g], 'AD', defaults)
    expect(results).toHaveLength(1)
  })
})

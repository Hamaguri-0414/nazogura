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
    const { group: g, combos, missCount } = results[0]
    expect(g.name).toBe('指の名前')
    expect(missCount).toBe(0)
    expect(combos).toHaveLength(1)
    expect(combos[0].picks).toEqual([
      { char: 'ひ', matched: true, elementIndex: 1, charIndexInElement: 0, exact: true },
      { char: 'か', matched: true, elementIndex: 2, charIndexInElement: 1, exact: true },
      { char: 'り', matched: true, elementIndex: 3, charIndexInElement: 2, exact: true },
    ])
  })

  it('カタカナ入力でも同様に見つかる', () => {
    const results = searchThemes([fingers], 'ヒカリ', defaults)
    expect(results).toHaveLength(1)
  })

  it('同じ文字が2回必要な場合、別の要素から拾う', () => {
    const results = searchThemes([weekdays], 'かか', defaults)
    expect(results).toHaveLength(0)
    const twoKa = searchThemes([group('か2つ', ['かき', 'かく'])], 'かか', defaults)
    expect(twoKa).toHaveLength(1)
    for (const combo of twoKa[0].combos) {
      const idx = combo.picks.map((p) => p.elementIndex)
      expect(new Set(idx).size).toBe(2)
    }
  })

  it('増加路が必要なケースでも最大マッチングを見つける', () => {
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
    expect(results[0].combos[0].picks[3]).toEqual({ char: 'ん', matched: false })
  })

  it('表記ゆれ: 区別しないなら「ひがり」でも見つかり、読み替え数が付く', () => {
    const results = searchThemes([fingers], 'ひがり', defaults)
    expect(results).toHaveLength(1)
    expect(results[0].combos[0].fuzzyCount).toBe(1)
    expect(
      searchThemes([fingers], 'ひがり', { ...defaults, ignoreVariants: false }),
    ).toHaveLength(0)
  })

  it('同一要素からの複数拾い: OFFでは不可、ONなら可', () => {
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

  it('拾い方が複数あれば全て列挙される', () => {
    // 「あ」は あか・あい から、「お」は あお のみから拾える → 2通り
    const rainbow = group('虹の色', ['あか', 'だいだい', 'き', 'みどり', 'あお', 'あい', 'むらさき'])
    const results = searchThemes([rainbow], 'あお', defaults)
    expect(results).toHaveLength(1)
    expect(results[0].combos).toHaveLength(2)
    expect(results[0].combosTruncated).toBe(false)
    const firstPicks = results[0].combos.map((c) => c.picks[0].elementIndex)
    expect(new Set(firstPicks)).toEqual(new Set([0, 5]))
  })

  it('読み替えなしで成立する組み合わせが優先される', () => {
    // 「か」は がま(読み替え) と かめ(そのまま) の両方から拾える
    const g = group('読み替え優先', ['がま', 'かめ'])
    const results = searchThemes([g], 'か', defaults)
    expect(results[0].combos).toHaveLength(2)
    expect(results[0].combos[0].fuzzyCount).toBe(0)
    expect(results[0].combos[0].picks[0].elementIndex).toBe(1)
    expect(results[0].combos[1].fuzzyCount).toBe(1)
  })

  it('要素内に読み替え一致とそのまま一致の両方があれば、そのままの位置を拾う', () => {
    // 「はば」の1文字目は読み替えで「ば」に一致するが、2文字目がそのまま一致する
    const g = group('位置の優先', ['はば'])
    const results = searchThemes([g], 'ば', defaults)
    const pick = results[0].combos[0].picks[0]
    expect(pick.charIndexInElement).toBe(1)
    expect(pick.exact).toBe(true)
    expect(results[0].combos[0].fuzzyCount).toBe(0)
  })
})

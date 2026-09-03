import { useState } from 'react'
import type { Group } from '../shared/types'
import type { PickCombo } from '../shared/search'

/** 要素ごとの「拾われた文字位置」の集合を作る */
export function pickedPositions(combo: PickCombo): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>()
  for (const pick of combo.picks) {
    if (!pick.matched) continue
    const set = map.get(pick.elementIndex!) ?? new Set<number>()
    set.add(pick.charIndexInElement!)
    map.set(pick.elementIndex!, set)
  }
  return map
}

/** 要素のテキストを、指定位置をハイライトしつつ描画する */
export function HighlightedElement({
  text,
  positions,
}: {
  text: string
  positions: Set<number> | undefined
}) {
  return (
    <>
      {[...text].map((ch, k) => (
        <span key={k} className={positions?.has(k) ? 'picked' : undefined}>
          {ch}
        </span>
      ))}
    </>
  )
}

/** グループの要素一覧を、拾われた文字のハイライト付きで描画する */
export function ElementStrip({
  group,
  picked,
}: {
  group: Group
  picked?: Map<number, Set<number>> | null
}) {
  return (
    <div className="element-strip">
      {group.elements.map((el, j) => (
        <span key={j} className="elem">
          <HighlightedElement text={el} positions={picked?.get(j)} />
        </span>
      ))}
    </div>
  )
}

/** 「他の組み合わせ」の開閉と選択UI。組み合わせが1つ以下なら何も描画しない */
export function ComboSwitcher({
  group,
  combos,
  truncated,
  selectedIndex,
  onSelect,
}: {
  group: Group
  combos: PickCombo[]
  truncated: boolean
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  if (combos.length <= 1) return null
  return (
    <div className="combo-area">
      <button className="combo-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▾' : '▸'} 他の組み合わせ {combos.length - 1}件
        {truncated ? '以上' : ''}
      </button>
      {expanded && (
        <ol className="combo-list">
          {combos.map((c, idx) => (
            <li key={idx}>
              <button
                className={idx === selectedIndex ? 'combo-row selected' : 'combo-row'}
                onClick={() => onSelect(idx)}
              >
                <ComboInline group={group} combo={c} />
                {c.fuzzyCount > 0 && (
                  <span className="fuzzy-note">読み替え{c.fuzzyCount}文字</span>
                )}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** 1つの組み合わせを「拾い元の要素を答えの文字順に並べた」1行で描画する */
export function ComboInline({ group, combo }: { group: Group; combo: PickCombo }) {
  return (
    <span className="combo-inline">
      {combo.picks.map((pick, i) => (
        <span key={i} className={pick.matched ? 'combo-part' : 'combo-part missed'}>
          {pick.matched ? (
            <HighlightedElement
              text={group.elements[pick.elementIndex!]}
              positions={new Set([pick.charIndexInElement!])}
            />
          ) : (
            <>「{pick.char}」なし</>
          )}
        </span>
      ))}
    </span>
  )
}

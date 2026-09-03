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

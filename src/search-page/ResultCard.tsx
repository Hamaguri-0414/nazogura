import { useState } from 'react'
import type { Group } from '../shared/types'
import type { PickCombo, ThemeMatch } from '../shared/search'

/** 要素ごとの「拾われた文字位置」の集合を作る */
function pickedPositions(combo: PickCombo): Map<number, Set<number>> {
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
function HighlightedElement({
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
function ComboInline({ group, combo }: { group: Group; combo: PickCombo }) {
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

export function ResultCard({ match }: { match: ThemeMatch }) {
  const { group, combos, combosTruncated, missCount } = match
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const combo = combos[selectedIndex] ?? combos[0]
  const picked = pickedPositions(combo)

  return (
    <section className="card result-card">
      <h2>
        {group.name}
        {group.category !== '' && <span className="category">{group.category}</span>}
        {missCount > 0 && <span className="miss-badge">{missCount}文字拾えません</span>}
      </h2>

      <div className="element-strip">
        {group.elements.map((el, j) => (
          <span key={j} className="elem">
            <HighlightedElement text={el} positions={picked.get(j)} />
          </span>
        ))}
      </div>

      <ul className="pick-list">
        {combo.picks.map((pick, i) => (
          <li key={i} className={pick.matched ? undefined : 'missed'}>
            {pick.matched ? (
              <HighlightedElement
                text={group.elements[pick.elementIndex!]}
                positions={new Set([pick.charIndexInElement!])}
              />
            ) : (
              <>「{pick.char}」は拾えません</>
            )}
          </li>
        ))}
      </ul>

      {combos.length > 1 && (
        <div className="combo-area">
          <button className="combo-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▾' : '▸'} 他の組み合わせ {combos.length - 1}件
            {combosTruncated ? '以上' : ''}
          </button>
          {expanded && (
            <ol className="combo-list">
              {combos.map((c, idx) => (
                <li key={idx}>
                  <button
                    className={
                      idx === selectedIndex ? 'combo-row selected' : 'combo-row'
                    }
                    onClick={() => setSelectedIndex(idx)}
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
      )}
    </section>
  )
}

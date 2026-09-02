import type { ThemeMatch } from '../shared/search'

/** 要素ごとの「拾われた文字位置」の集合を作る */
function pickedPositions(match: ThemeMatch): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>()
  for (const pick of match.picks) {
    if (!pick.matched) continue
    const set = map.get(pick.elementIndex!) ?? new Set<number>()
    set.add(pick.charIndexInElement!)
    map.set(pick.elementIndex!, set)
  }
  return map
}

export function ResultCard({ match }: { match: ThemeMatch }) {
  const { group, picks, missCount } = match
  const picked = pickedPositions(match)

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
            {[...el].map((ch, k) => (
              <span key={k} className={picked.get(j)?.has(k) ? 'picked' : undefined}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </div>

      <ul className="pick-list">
        {picks.map((pick, i) => (
          <li key={i} className={pick.matched ? undefined : 'missed'}>
            {pick.matched ? (
              [...group.elements[pick.elementIndex!]].map((ch, k) => (
                <span
                  key={k}
                  className={k === pick.charIndexInElement ? 'picked' : undefined}
                >
                  {ch}
                </span>
              ))
            ) : (
              <>「{pick.char}」は拾えません</>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

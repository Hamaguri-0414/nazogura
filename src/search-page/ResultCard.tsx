import { useState } from 'react'
import type { ThemeMatch } from '../shared/search'
import {
  ComboSwitcher,
  ElementStrip,
  HighlightedElement,
  pickedPositions,
} from '../components/PickDisplay'

export function ResultCard({ match }: { match: ThemeMatch }) {
  const { group, combos, combosTruncated, missCount } = match
  const [selectedIndex, setSelectedIndex] = useState(0)
  const combo = combos[selectedIndex] ?? combos[0]
  const picked = pickedPositions(combo)

  return (
    <section className="card result-card">
      <h2>
        {group.name}
        {missCount > 0 && <span className="miss-badge">{missCount}文字拾えません</span>}
      </h2>

      <ElementStrip group={group} picked={picked} />

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

      <ComboSwitcher
        group={group}
        combos={combos}
        truncated={combosTruncated}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />
    </section>
  )
}

import { useState } from 'react'
import type { ThemeMatch } from '../shared/search'
import {
  ComboInline,
  HighlightedElement,
  pickedPositions,
} from '../components/PickDisplay'

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

import { Fragment } from 'react'
import type { Group } from '../shared/types'

interface Props {
  group: Group
  /** null は計算中 */
  words: string[] | null
}

/** 文字数ごとに単語を区切る（辞書ファイルは五十音順のため、区切り内も五十音順になる） */
function groupByLength(words: string[]): Map<number, string[]> {
  const map = new Map<number, string[]>()
  for (const word of words) {
    const len = [...word].length
    const list = map.get(len)
    if (list) list.push(word)
    else map.set(len, [word])
  }
  return new Map([...map.entries()].sort((a, b) => a[0] - b[0]))
}

export function GroupDetail({ group, words }: Props) {
  return (
    <section className="card">
      <h2 className="wl-group-title">
        {group.name}
        {words !== null && (
          <span className="muted">{words.length.toLocaleString()}語</span>
        )}
      </h2>

      <div className="element-strip">
        {group.elements.map((el, j) => (
          <span key={j} className="elem">
            {el}
          </span>
        ))}
      </div>

      {words === null && <p className="loading">計算中…</p>}
      {words !== null && words.length === 0 && (
        <p className="no-result">このテーマから作れる単語は見つかりませんでした</p>
      )}
      {words !== null &&
        [...groupByLength(words).entries()].map(([len, list]) => (
          <Fragment key={len}>
            <h3 className="wl-length-heading">
              {len}文字 <span className="muted">({list.length.toLocaleString()})</span>
            </h3>
            <div className="word-flow">
              {list.map((w) => (
                <span key={w} className="word-chip">
                  {w}
                </span>
              ))}
            </div>
          </Fragment>
        ))}
    </section>
  )
}

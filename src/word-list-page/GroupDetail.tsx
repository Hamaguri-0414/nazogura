import { Fragment, memo, useEffect, useMemo, useState } from 'react'
import type { Group } from '../shared/types'
import type { ComposeOptions } from '../shared/wordCompose'
import { searchThemes, type ThemeMatch } from '../shared/search'
import {
  ComboInline,
  ComboSwitcher,
  ElementStrip,
  pickedPositions,
} from '../components/PickDisplay'

interface Props {
  group: Group
  /** null は計算中 */
  words: string[] | null
  options: ComposeOptions
}

/**
 * 文字数ごとに単語を区切り、文字数の多い順に並べる（長い単語ほど希少価値が高いため）。
 * 辞書ファイルは五十音順のため、区切り内は五十音順になる。
 */
function groupByLength(words: string[]): Map<number, string[]> {
  const map = new Map<number, string[]>()
  for (const word of words) {
    const len = [...word].length
    const list = map.get(len)
    if (list) list.push(word)
    else map.set(len, [word])
  }
  return new Map([...map.entries()].sort((a, b) => b[0] - a[0]))
}

/** 選択中の単語の拾い方を、単語チップの直後に差し込みで表示する */
function WordPickDetail({ group, match }: { group: Group; match: ThemeMatch }) {
  const [comboIndex, setComboIndex] = useState(0)
  const combo = match.combos[comboIndex] ?? match.combos[0]

  return (
    <div className="word-pick-detail">
      <ComboInline group={group} combo={combo} />
      {combo.fuzzyCount > 0 && (
        <span className="fuzzy-note">読み替え{combo.fuzzyCount}文字</span>
      )}
      <ComboSwitcher
        group={group}
        combos={match.combos}
        truncated={match.combosTruncated}
        selectedIndex={comboIndex}
        onSelect={setComboIndex}
      />
    </div>
  )
}

/**
 * 単語数スイープ中は親が高頻度で再レンダーされるため、propsが変わらない
 * 限り再レンダーしないようmemo化している。
 */
export const GroupDetail = memo(function GroupDetail({ group, words, options }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

  // グループやオプションが変わったら選択を解除する
  useEffect(() => {
    setSelectedWord(null)
  }, [group.id, options])

  const match = useMemo(() => {
    if (selectedWord === null) return null
    return (
      searchThemes([group], selectedWord, {
        allowedMisses: 0,
        ignoreVariants: options.ignoreVariants,
        allowMultiPick: options.allowMultiPick,
      })[0] ?? null
    )
  }, [group, selectedWord, options])

  const stripPicked =
    match !== null && match.combos.length > 0
      ? pickedPositions(match.combos[0])
      : null

  const byLength = useMemo(
    () => (words === null ? null : groupByLength(words)),
    [words],
  )

  return (
    <section className="card">
      <h2 className="wl-group-title">
        {group.name}
        {words !== null && (
          <span className="muted">{words.length.toLocaleString()}語</span>
        )}
      </h2>

      <ElementStrip group={group} picked={stripPicked} />

      {words === null && <p className="loading">計算中…</p>}
      {words !== null && words.length === 0 && (
        <p className="no-result">このテーマから作れる単語は見つかりませんでした</p>
      )}
      {byLength !== null &&
        [...byLength.entries()].map(([len, list]) => (
          <Fragment key={len}>
            <h3 className="wl-length-heading">
              {len}文字 <span className="muted">({list.length.toLocaleString()})</span>
            </h3>
            <div className="word-flow">
              {list.map((w) => (
                <Fragment key={w}>
                  <button
                    className={w === selectedWord ? 'word-chip selected' : 'word-chip'}
                    onClick={() => setSelectedWord(w === selectedWord ? null : w)}
                  >
                    {w}
                  </button>
                  {w === selectedWord && match !== null && (
                    <WordPickDetail group={group} match={match} />
                  )}
                </Fragment>
              ))}
            </div>
          </Fragment>
        ))}
    </section>
  )
})

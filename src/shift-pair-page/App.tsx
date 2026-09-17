import { useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  ALPHABET_SEQUENCE,
  KANA_SEQUENCE,
  findShiftPairs,
  isRepeatedWord,
  type ShiftPair,
} from '../shared/shiftPairs'

type TabId = 'ja' | 'en'

interface TabDef {
  id: TabId
  name: string
  sequence: string[]
  file: string
  sourceName: string
  note: string
}

const TABS: TabDef[] = [
  {
    id: 'ja',
    name: '日本語（五十音順）',
    sequence: KANA_SEQUENCE,
    file: 'buta.txt',
    sourceName: '豚辞書',
    note: '「ん」の次は「あ」に折り返します。濁点・半濁点・長音を含む単語は対象外です。',
  },
  {
    id: 'en',
    name: '英語（アルファベット順）',
    sequence: ALPHABET_SEQUENCE,
    file: 'english-all.txt',
    sourceName: '統合英単語辞書（CEFR-J＋ターゲット1200）',
    note: '「z」の次は「a」に折り返します。',
  },
]

const LENGTH_OPTIONS = [2, 3, 4, 5, 6]

export function App() {
  const [pairsByTab, setPairsByTab] = useState<Partial<Record<TabId, ShiftPair[]>>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tabId, setTabId] = useState<TabId>('ja')
  const [lengthFilter, setLengthFilter] = useState<number | 'all'>(3)
  const [shiftFilter, setShiftFilter] = useState<number | 'all'>('all')
  const [query, setQuery] = useState('')
  const [excludeRepeats, setExcludeRepeats] = useState(true)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all(
      TABS.map(async (tab) => {
        const res = await fetch(`${base}data/words/${tab.file}`)
        if (!res.ok) throw new Error(tab.file)
        const text = await res.text()
        return [tab.id, findShiftPairs(text.split('\n'), tab.sequence)] as const
      }),
    )
      .then((entries) => setPairsByTab(Object.fromEntries(entries)))
      .catch((err: Error) => setLoadError(`読み込みに失敗しました（${err.message}）`))
  }, [])

  const tab = TABS.find((t) => t.id === tabId)!
  const pairs = pairsByTab[tabId]

  const filtered = useMemo(() => {
    if (pairs === undefined) return undefined
    const q = query.trim().toLowerCase()
    return pairs.filter(
      (p) =>
        (lengthFilter === 'all' || [...p.from].length === lengthFilter) &&
        (shiftFilter === 'all' || p.shift === shiftFilter) &&
        // ずらし変換は繰り返し構造を保存するため from 側の判定だけでよい
        (!excludeRepeats || !isRepeatedWord(p.from)) &&
        (q === '' || p.from.includes(q) || p.to.includes(q)),
    )
  }, [pairs, lengthFilter, shiftFilter, query, excludeRepeats])

  // ずらし数ごとのセクションに分ける（採用済みの向きのみなので +1 〜 +半分）
  const sections = useMemo(() => {
    if (filtered === undefined) return undefined
    const map = new Map<number, ShiftPair[]>()
    for (const p of filtered) {
      const list = map.get(p.shift)
      if (list) list.push(p)
      else map.set(p.shift, [p])
    }
    return [...map.entries()]
  }, [filtered])

  const maxShift = Math.floor(tab.sequence.length / 2)

  return (
    <>
      <SiteHeader />
      <main className="sp-main">
        <h1>文字ずらし対応表</h1>
        <p className="lead">
          単語の各文字を五十音順・アルファベット順で+nずらすと、辞書の別の単語になる組の一覧です。
          A→BとB→Aは、プラス方向のずらし数が小さい向きだけを載せています。
        </p>

        <div className="card">
          <div className="dict-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={t.id === tabId ? 'dict-tab active' : 'dict-tab'}
                onClick={() => setTabId(t.id)}
              >
                {t.name}
                {pairsByTab[t.id] !== undefined && (
                  <span className="dict-count">{pairsByTab[t.id]!.length.toLocaleString()}組</span>
                )}
              </button>
            ))}
          </div>
          <p className="sp-sequence">
            {tab.sequence.map((char, i) => (
              <span className="sp-sequence-char" key={i}>
                {char}
              </span>
            ))}
          </p>
          <p className="muted sp-note">
            出典: {tab.sourceName}（{tab.file}）。{tab.note}
          </p>
          <div className="sp-filters">
            <label>
              文字数
              <select
                value={lengthFilter}
                onChange={(e) =>
                  setLengthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
              >
                <option value="all">すべて</option>
                {LENGTH_OPTIONS.map((len) => (
                  <option key={len} value={len}>
                    {len}文字
                  </option>
                ))}
              </select>
            </label>
            <label>
              ずらし数
              <select
                value={shiftFilter}
                onChange={(e) =>
                  setShiftFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
              >
                <option value="all">すべて</option>
                {Array.from({ length: maxShift }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    +{n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              検索
              <input
                type="text"
                value={query}
                placeholder="単語の一部"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={excludeRepeats}
                onChange={(e) => setExcludeRepeats(e.target.checked)}
              />
              繰り返し語（オノマトペなど）を除く
            </label>
          </div>
        </div>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {pairs === undefined && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {filtered !== undefined && sections !== undefined && (
          <>
            <p className="muted">
              {filtered.length.toLocaleString()}組（全{pairs!.length.toLocaleString()}組）
            </p>
            {filtered.length === 0 && <p className="no-result">該当する組がありません</p>}
            {sections.map(([shift, list]) => (
              <section className="sp-section" key={shift}>
                <h2 className="sp-shift-heading">
                  +{shift}
                  <span className="muted">{list.length.toLocaleString()}組</span>
                </h2>
                <ul className="sp-pairs">
                  {list.map((p) => (
                    <li className="sp-pair" key={`${p.from}-${p.to}`}>
                      <span className="sp-word">{p.from}</span>
                      <span className="sp-arrow">→</span>
                      <span className="sp-word">{p.to}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>
    </>
  )
}

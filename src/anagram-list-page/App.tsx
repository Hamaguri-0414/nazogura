import { useEffect, useMemo, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  buildAnagramGroups,
  groupLength,
  type AnagramGroup,
} from '../shared/anagramList'

interface Language {
  id: string
  label: string
  file: string
  note: string
}

const LANGUAGES: Language[] = [
  { id: 'ja', label: '日本語', file: 'common.txt', note: '一般辞書' },
  { id: 'en', label: '英語', file: 'english-all.txt', note: '中学レベル英単語' },
]

export function App() {
  const [langId, setLangId] = useState('ja')
  const [groups, setGroups] = useState<AnagramGroup[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lengthFilter, setLengthFilter] = useState<number | null>(null)
  const [multiOnly, setMultiOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [hideMode, setHideMode] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  // 言語ごとの組をキャッシュ（取得中の同時要求も1つに束ねる）
  const cache = useRef(new Map<string, Promise<AnagramGroup[]>>())

  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.id === langId)!
    let loading = cache.current.get(langId)
    if (!loading) {
      loading = fetch(`${import.meta.env.BASE_URL}data/words/${lang.file}`)
        .then((r) => {
          if (!r.ok) throw new Error(lang.file)
          return r.text()
        })
        .then((text) => buildAnagramGroups(text.split('\n').filter((w) => w !== '')))
      cache.current.set(langId, loading)
      loading.catch(() => cache.current.delete(langId))
    }
    let cancelled = false
    setGroups(null)
    setLoadError(null)
    setLengthFilter(null)
    setRevealed(new Set())
    loading
      .then((gs) => {
        if (!cancelled) setGroups(gs)
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(`読み込みに失敗しました（${err.message}）`)
      })
    return () => {
      cancelled = true
    }
  }, [langId])

  // 存在する文字数の一覧（タブ用）
  const lengths = useMemo(() => {
    if (groups === null) return []
    return [...new Set(groups.map(groupLength))].sort((a, b) => a - b)
  }, [groups])

  const filtered = useMemo(() => {
    if (groups === null) return []
    const q = query.trim().toLowerCase()
    return groups.filter((g) => {
      if (lengthFilter !== null && groupLength(g) !== lengthFilter) return false
      if (multiOnly && g.words.length < 3) return false
      if (q !== '' && !g.words.some((w) => w.toLowerCase().includes(q))) return false
      return true
    })
  }, [groups, lengthFilter, multiOnly, query])

  // 文字数ごとのセクションに分ける（組は文字数昇順に並んでいる前提）
  const sections = useMemo(() => {
    const result: { length: number; groups: AnagramGroup[] }[] = []
    for (const g of filtered) {
      const len = groupLength(g)
      const last = result[result.length - 1]
      if (last !== undefined && last.length === len) {
        last.groups.push(g)
      } else {
        result.push({ length: len, groups: [g] })
      }
    }
    return result
  }, [filtered])

  const toggleReveal = (key: string) => {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <>
      <SiteHeader />
      <main className="al-main">
        <h1>アナグラム全暗記</h1>
        <p className="lead">
          文字を並べ替えると別の単語になる組を、辞書からすべて洗い出した一覧です。
          「この文字構成は並べ替えられる」と反射で気づけるよう、まるごと覚えるのに使ってください。
        </p>

        <div className="card">
          <div className="dict-tabs">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                className={lang.id === langId ? 'dict-tab active' : 'dict-tab'}
                onClick={() => setLangId(lang.id)}
              >
                {lang.label}
                <span className="dict-count">{lang.note}</span>
              </button>
            ))}
          </div>
          {groups !== null && (
            <>
              <div className="al-length-tabs">
                <button
                  className={lengthFilter === null ? 'al-length-tab active' : 'al-length-tab'}
                  onClick={() => setLengthFilter(null)}
                >
                  すべて
                </button>
                {lengths.map((len) => (
                  <button
                    key={len}
                    className={lengthFilter === len ? 'al-length-tab active' : 'al-length-tab'}
                    onClick={() => setLengthFilter(len)}
                  >
                    {len}文字
                  </button>
                ))}
              </div>
              <div className="al-options">
                <label className="al-option">
                  <input
                    type="checkbox"
                    checked={multiOnly}
                    onChange={(e) => setMultiOnly(e.target.checked)}
                  />
                  3語以上の組だけ
                </label>
                <label className="al-option">
                  <input
                    type="checkbox"
                    checked={hideMode}
                    onChange={(e) => {
                      setHideMode(e.target.checked)
                      setRevealed(new Set())
                    }}
                  />
                  暗記モード（2語目以降を隠す）
                </label>
                <input
                  type="text"
                  className="al-query"
                  placeholder="単語で絞り込み"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {groups === null && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {groups !== null && (
          <>
            <p className="muted al-status">
              全{groups.length.toLocaleString()}組
              {filtered.length !== groups.length &&
                ` 中 ${filtered.length.toLocaleString()}組を表示`}
            </p>
            {filtered.length === 0 && <p className="no-result">該当する組がありません</p>}
            {sections.map((section) => (
              <section key={section.length} className="card al-section">
                <h2 className="al-section-heading">
                  {section.length}文字
                  <span className="muted">{section.groups.length.toLocaleString()}組</span>
                </h2>
                <ul className="al-group-list">
                  {section.groups.map((g) => {
                    const hidden = hideMode && !revealed.has(g.key)
                    const row = (
                      <>
                        {g.words.map((word, i) => (
                          <span
                            key={word}
                            className={
                              hidden && i > 0 ? 'al-word al-word-hidden' : 'al-word'
                            }
                          >
                            {hidden && i > 0 ? '？'.repeat([...word].length) : word}
                          </span>
                        ))}
                        {g.words.length >= 3 && (
                          <span className="al-badge">{g.words.length}語</span>
                        )}
                      </>
                    )
                    return (
                      <li key={g.key}>
                        {hideMode ? (
                          <button
                            className="al-group al-group-button"
                            onClick={() => toggleReveal(g.key)}
                            title={hidden ? 'タップで答えを表示' : 'タップで隠す'}
                          >
                            {row}
                          </button>
                        ) : (
                          <div className="al-group">{row}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </>
        )}
      </main>
    </>
  )
}

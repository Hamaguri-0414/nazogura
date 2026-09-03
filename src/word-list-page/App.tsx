import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dictionary, Group } from '../shared/types'
import {
  createGroupMatcher,
  normalizeWord,
  type ComposeOptions,
} from '../shared/wordCompose'
import { SiteHeader } from '../components/SiteHeader'
import { GroupDetail } from './GroupDetail'

interface WordDict {
  id: string
  name: string
  file: string
  count: number
}

/** チャンク処理の粒度（この件数ごとにUIへ制御を返す） */
const CHUNK = 20000

const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export function App() {
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [wordDicts, setWordDicts] = useState<WordDict[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDictId, setSelectedDictId] = useState('core')
  const [options, setOptions] = useState<ComposeOptions>({
    ignoreVariants: false,
    allowMultiPick: false,
  })
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [sweepDone, setSweepDone] = useState(0)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedWords, setSelectedWords] = useState<string[] | null>(null)
  const [loadingWords, setLoadingWords] = useState(false)

  // 単語リスト（生データ）と正規化済みデータのキャッシュ
  const wordsCache = useRef(new Map<string, string[]>())
  const normCache = useRef(new Map<string, string[][]>())

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}data/dictionary.json`).then((r) => {
        if (!r.ok) throw new Error('dictionary.json')
        return r.json() as Promise<Dictionary>
      }),
      fetch(`${base}data/words/index.json`).then((r) => {
        if (!r.ok) throw new Error('words/index.json')
        return r.json() as Promise<WordDict[]>
      }),
    ])
      .then(([dict, index]) => {
        setGroups(dict.groups.filter((g) => g.isPublished))
        setWordDicts(index)
      })
      .catch((err: Error) => setLoadError(`読み込みに失敗しました（${err.message}）`))
  }, [])

  const ensureWords = useCallback(
    async (dictId: string): Promise<string[]> => {
      const cached = wordsCache.current.get(dictId)
      if (cached) return cached
      const dict = wordDicts?.find((d) => d.id === dictId)
      if (!dict) throw new Error('unknown dictionary')
      setLoadingWords(true)
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/words/${dict.file}`)
        if (!res.ok) throw new Error(dict.file)
        const text = await res.text()
        const words = text.split('\n').filter((w) => w !== '')
        wordsCache.current.set(dictId, words)
        return words
      } finally {
        setLoadingWords(false)
      }
    },
    [wordDicts],
  )

  const ensureNorm = useCallback(
    async (dictId: string, ignoreVariants: boolean): Promise<string[][]> => {
      const key = `${dictId}:${ignoreVariants}`
      const cached = normCache.current.get(key)
      if (cached) return cached
      const words = await ensureWords(dictId)
      const norm: string[][] = new Array(words.length)
      for (let i = 0; i < words.length; i++) {
        norm[i] = normalizeWord(words[i], ignoreVariants)
        if (i % CHUNK === CHUNK - 1) await yieldToUi()
      }
      normCache.current.set(key, norm)
      return norm
    },
    [ensureWords],
  )

  // 全グループの「作れる単語数」をバックグラウンドで計算する
  useEffect(() => {
    if (groups === null || wordDicts === null) return
    let cancelled = false
    setCounts(new Map())
    setSweepDone(0)
    void (async () => {
      const norm = await ensureNorm(selectedDictId, options.ignoreVariants)
      for (const group of groups) {
        if (cancelled) return
        const matcher = createGroupMatcher(group, options)
        let count = 0
        for (const wordChars of norm) {
          if (matcher.canCompose(wordChars)) count++
        }
        setCounts((prev) => new Map(prev).set(group.id, count))
        setSweepDone((done) => done + 1)
        await yieldToUi()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [groups, wordDicts, selectedDictId, options, ensureNorm])

  // 選択中グループの単語一覧を計算する
  useEffect(() => {
    if (groups === null || selectedGroupId === null) {
      setSelectedWords(null)
      return
    }
    const group = groups.find((g) => g.id === selectedGroupId)
    if (!group) {
      setSelectedWords(null)
      return
    }
    let cancelled = false
    setSelectedWords(null)
    void (async () => {
      const words = await ensureWords(selectedDictId)
      const norm = await ensureNorm(selectedDictId, options.ignoreVariants)
      if (cancelled) return
      const matcher = createGroupMatcher(group, options)
      const found: string[] = []
      for (let i = 0; i < norm.length; i++) {
        if (matcher.canCompose(norm[i])) found.push(words[i])
      }
      if (!cancelled) setSelectedWords(found)
    })()
    return () => {
      cancelled = true
    }
  }, [groups, selectedGroupId, selectedDictId, options, ensureWords, ensureNorm])

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId) ?? null

  return (
    <>
      <SiteHeader />
      <main className="wl-main">
        <h1>テーマ別単語リスト</h1>
        <p className="lead">
          各テーマの要素から1文字ずつ拾って作れる単語を、単語辞書から探して一覧します。
        </p>

        <div className="card">
          <div className="dict-tabs">
            {wordDicts?.map((d) => (
              <button
                key={d.id}
                className={d.id === selectedDictId ? 'dict-tab active' : 'dict-tab'}
                onClick={() => setSelectedDictId(d.id)}
              >
                {d.name}
                <span className="dict-count">{d.count.toLocaleString()}語</span>
              </button>
            ))}
          </div>
          <div className="search-options">
            <label>
              <input
                type="checkbox"
                checked={options.ignoreVariants}
                onChange={(e) =>
                  setOptions({ ...options, ignoreVariants: e.target.checked })
                }
              />
              濁音・半濁音・小さい文字は区別しない
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.allowMultiPick}
                onChange={(e) =>
                  setOptions({ ...options, allowMultiPick: e.target.checked })
                }
              />
              同じ要素から2文字以上拾うことを許可する
            </label>
          </div>
        </div>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {groups === null && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {groups !== null && (
          <div className="wl-layout">
            <nav className="group-nav card">
              <p className="muted group-nav-status">
                {loadingWords
                  ? '単語辞書を読み込み中…'
                  : sweepDone < groups.length
                    ? `単語数を計算中… ${sweepDone}/${groups.length}`
                    : `全${groups.length}グループ`}
              </p>
              <ul>
                {groups.map((g) => (
                  <li key={g.id}>
                    <button
                      className={g.id === selectedGroupId ? 'group-row selected' : 'group-row'}
                      onClick={() => setSelectedGroupId(g.id)}
                    >
                      <span className="group-row-name">{g.name}</span>
                      <span className="group-row-count">
                        {counts.has(g.id) ? `${counts.get(g.id)!.toLocaleString()}語` : '…'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="wl-detail">
              {selectedGroup !== null && (
                <GroupDetail
                  group={selectedGroup}
                  words={selectedWords}
                  options={options}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

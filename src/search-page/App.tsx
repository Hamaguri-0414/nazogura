import { useEffect, useMemo, useState } from 'react'
import type { Dictionary } from '../shared/types'
import { searchThemes, type SearchOptions, type ThemeMatch } from '../shared/search'
import { SiteHeader } from '../components/SiteHeader'
import { ResultCard } from './ResultCard'

const INPUT_RE = /^[ぁ-ゖァ-ヶーa-zA-Z]+$/u
const MAX_LENGTH = 10

export function App() {
  const [dict, setDict] = useState<Dictionary | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [options, setOptions] = useState<SearchOptions>({
    allowedMisses: 0,
    ignoreVariants: true,
    allowMultiPick: false,
  })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/dictionary.json`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json() as Promise<Dictionary>
      })
      .then(setDict)
      .catch(() => setLoadError(true))
  }, [])

  const results: ThemeMatch[] | null = useMemo(() => {
    if (dict === null || submittedQuery === null) return null
    return searchThemes(dict.groups, submittedQuery, options)
  }, [dict, submittedQuery, options])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed === '') {
      setInputError('答えの単語を入力してください')
      setSubmittedQuery(null)
      return
    }
    if (!INPUT_RE.test(trimmed)) {
      setInputError('ひらがな・カタカナ・半角英字で入力してください')
      setSubmittedQuery(null)
      return
    }
    if ([...trimmed].length > MAX_LENGTH) {
      setInputError(`${MAX_LENGTH}文字以内で入力してください`)
      setSubmittedQuery(null)
      return
    }
    setInputError(null)
    setSubmittedQuery(trimmed)
  }

  return (
    <>
      <SiteHeader />
      <main>
        <h1>テーマ逆引き検索</h1>
        <p className="lead">答えにしたい単語から、使えるテーマを逆引きします。</p>

        <div className="card">
          <form className="search-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例: ひかり"
              aria-label="答えの単語"
            />
            <button type="submit" className="primary" disabled={dict === null}>
              検索
            </button>
          </form>
          {inputError !== null && <p className="field-error">{inputError}</p>}

          <div className="search-options">
            <label>
              許容する未マッチ文字数
              <select
                value={options.allowedMisses}
                onChange={(e) =>
                  setOptions({ ...options, allowedMisses: Number(e.target.value) })
                }
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.ignoreVariants}
                onChange={(e) =>
                  setOptions({ ...options, ignoreVariants: e.target.checked })
                }
              />
              濁点・半濁点・小さい音を区別しない
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.allowMultiPick}
                onChange={(e) =>
                  setOptions({ ...options, allowMultiPick: e.target.checked })
                }
              />
              同じ要素から2文字以上拾うことを許可
            </label>
          </div>
        </div>

        {loadError && <p className="field-error">辞書の読み込みに失敗しました。</p>}
        {dict === null && !loadError && <p className="loading">辞書を読み込んでいます…</p>}

        {results !== null && (
          <>
            <p className="result-summary">検索結果: {results.length}件</p>
            {results.length === 0 && (
              <p className="no-result">
                見つかりませんでした。
                <br />
                「許容する未マッチ文字数」を増やすと候補が見つかるかもしれません。
              </p>
            )}
            {results.map((match) => (
              <ResultCard key={match.group.id} match={match} />
            ))}
          </>
        )}
      </main>
    </>
  )
}

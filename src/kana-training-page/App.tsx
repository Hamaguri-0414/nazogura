import { useEffect, useMemo, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { toBase } from '../shared/normalize'
import {
  GOJUON_COLUMNS,
  circledNumber,
  filterTrainingWords,
  marksFor,
} from '../shared/kanaTraining'

/** 直近の出題と重複しないよう記憶する問題数 */
const RECENT_LIMIT = 20

type Phase = 'answering' | 'correct' | 'revealed'

interface Stats {
  asked: number
  correct: number
  streak: number
  bestStreak: number
}

const INITIAL_STATS: Stats = { asked: 0, correct: 0, streak: 0, bestStreak: 0 }

function pickWord(pool: string[], recent: string[]): string {
  for (let i = 0; i < 50; i++) {
    const word = pool[Math.floor(Math.random() * pool.length)]
    if (!recent.includes(word)) return word
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 五十音表。出題単語の文字のマスに丸数字を重ねて表示する */
function KanaGrid({ marks }: { marks: Map<string, number[]> }) {
  return (
    <div className="kana-grid" role="img" aria-label="五十音表">
      {GOJUON_COLUMNS.map((col, ci) => (
        <div className="kana-col" key={ci}>
          {col.map((kana, ri) =>
            kana === null ? (
              <div className="kana-cell empty" key={ri} />
            ) : (
              <div className="kana-cell" key={ri}>
                <span className="kana-char">{kana}</span>
                {marks.has(kana) && (
                  <span className="kana-marks">
                    {marks.get(kana)!.map((n) => (
                      <span className="kana-mark" key={n}>
                        {circledNumber(n)}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  )
}

export function App() {
  const [pool, setPool] = useState<string[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [word, setWord] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('answering')
  const [wrong, setWrong] = useState(false)
  const [stats, setStats] = useState<Stats>(INITIAL_STATS)
  const recentRef = useRef<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/words/core.txt`)
      .then((r) => {
        if (!r.ok) throw new Error('core.txt')
        return r.text()
      })
      .then((text) => {
        const words = filterTrainingWords(text.split('\n'))
        setPool(words)
        setWord(pickWord(words, []))
      })
      .catch((err: Error) => setLoadError(`読み込みに失敗しました（${err.message}）`))
  }, [])

  const marks = useMemo(() => (word === null ? null : marksFor(word)), [word])

  const nextQuestion = () => {
    if (pool === null || word === null) return
    recentRef.current = [word, ...recentRef.current].slice(0, RECENT_LIMIT)
    setWord(pickWord(pool, recentRef.current))
    setInput('')
    setPhase('answering')
    setWrong(false)
    inputRef.current?.focus()
  }

  const submit = () => {
    if (word === null || phase !== 'answering') return
    const answer = toBase(input.trim())
    if (answer === '') return
    if (answer === word) {
      setPhase('correct')
      setWrong(false)
      setStats((s) => {
        const streak = s.streak + 1
        return {
          asked: s.asked + 1,
          correct: s.correct + 1,
          streak,
          bestStreak: Math.max(s.bestStreak, streak),
        }
      })
    } else {
      // 不正解は再挑戦できるが、連続正解は途切れる
      setWrong(true)
      setStats((s) => ({ ...s, streak: 0 }))
    }
  }

  const reveal = () => {
    if (phase !== 'answering') return
    setPhase('revealed')
    setStats((s) => ({ ...s, asked: s.asked + 1, streak: 0 }))
  }

  const done = phase !== 'answering'

  return (
    <>
      <SiteHeader />
      <main className="kt-main">
        <h1>五十音文字拾いトレーニング</h1>
        <p className="lead">
          五十音表に置かれた丸数字を①から順に拾うと、ひとつの単語になります。
          導いた単語を入力してください。
        </p>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {pool === null && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {word !== null && marks !== null && (
          <>
            <div className="kt-stats muted">
              <span>
                正解 {stats.correct} / {stats.asked} 問
              </span>
              <span>連続正解 {stats.streak}</span>
              <span>最高連続 {stats.bestStreak}</span>
            </div>

            <div className="card kt-board">
              <KanaGrid marks={marks} />

              <div className="kt-answer">
                {phase === 'correct' && (
                  <p className="kt-result correct">
                    正解！ <strong>{word}</strong>
                  </p>
                )}
                {phase === 'revealed' && (
                  <p className="kt-result revealed">
                    答えは <strong>{word}</strong> でした
                  </p>
                )}
                {done ? (
                  <button className="primary" onClick={nextQuestion} autoFocus>
                    次の問題へ
                  </button>
                ) : (
                  <>
                    <div className="kt-input-row">
                      <input
                        type="text"
                        ref={inputRef}
                        className={wrong ? 'invalid' : undefined}
                        value={input}
                        placeholder={`ひらがな${[...word].length}文字`}
                        autoFocus
                        onChange={(e) => {
                          setInput(e.target.value)
                          setWrong(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                            submit()
                          }
                        }}
                      />
                      <button className="primary" onClick={submit}>
                        解答
                      </button>
                    </div>
                    {wrong && <p className="field-error">不正解…もう一度！</p>}
                    <button className="kt-giveup" onClick={reveal}>
                      答えを見る
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}

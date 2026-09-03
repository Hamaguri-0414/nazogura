import { useEffect, useMemo, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  TrainingAnswerPanel,
  TrainingStatsBar,
  useTrainingGame,
} from '../components/TrainingGame'
import {
  GOJUON_COLUMNS,
  circledNumber,
  filterTrainingWords,
  marksFor,
} from '../shared/kanaTraining'

/**
 * 仮名を伏せた五十音表。出題単語の文字のマスに丸数字だけを表示し、
 * マスの位置からどの仮名かを思い出してもらう。
 */
function KanaGrid({ marks }: { marks: Map<string, number[]> }) {
  return (
    <div className="kana-grid" role="img" aria-label="仮名を伏せた五十音表">
      {GOJUON_COLUMNS.map((col, ci) => (
        <div className="kana-col" key={ci}>
          {col.map((kana, ri) =>
            kana === null ? (
              <div className="kana-cell empty" key={ri} />
            ) : (
              <div className="kana-cell" key={ri}>
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

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/words/core.txt`)
      .then((r) => {
        if (!r.ok) throw new Error('core.txt')
        return r.text()
      })
      .then((text) => setPool(filterTrainingWords(text.split('\n'))))
      .catch((err: Error) => setLoadError(`読み込みに失敗しました（${err.message}）`))
  }, [])

  const game = useTrainingGame<string, string>(pool, {
    makeQuestion: (word) => word,
    isCorrect: (word, answer) => answer === word,
  })

  const marks = useMemo(
    () => (game.question === null ? null : marksFor(game.question)),
    [game.question],
  )

  return (
    <>
      <SiteHeader />
      <main className="kt-main">
        <h1>五十音文字拾いトレーニング</h1>
        <p className="lead">
          仮名の伏せられた五十音表に丸数字が置かれています。
          マスの位置から仮名を思い出し、①から順に拾ってできる単語を入力してください。
        </p>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {pool === null && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {game.question !== null && marks !== null && (
          <>
            <TrainingStatsBar stats={game.stats} />
            <div className="card kt-board">
              <KanaGrid marks={marks} />
              <TrainingAnswerPanel
                game={game}
                placeholder={`ひらがな${[...game.question].length}文字`}
                answer={game.question}
              />
            </div>
          </>
        )}
      </main>
    </>
  )
}

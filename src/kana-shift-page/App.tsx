import { useEffect, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  TrainingAnswerPanel,
  TrainingStatsBar,
  useTrainingGame,
} from '../components/TrainingGame'
import {
  encodableRules,
  filterShiftWords,
  makeShiftQuestion,
  type ShiftQuestion,
} from '../shared/kanaShift'

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
      .then((text) => setPool(filterShiftWords(text.split('\n'))))
      .catch((err: Error) => setLoadError(`読み込みに失敗しました（${err.message}）`))
  }, [])

  const game = useTrainingGame<string, ShiftQuestion>(pool, {
    makeQuestion: (word) => {
      // プールの単語は必ず1つ以上のルールで出題できる
      const rules = encodableRules(word)
      const rule = rules[Math.floor(Math.random() * rules.length)]
      return makeShiftQuestion(word, rule)!
    },
    isCorrect: (q, answer) => answer === q.answer,
  })

  return (
    <>
      <SiteHeader />
      <main className="ks-main">
        <h1>五十音シフトトレーニング</h1>
        <p className="lead">
          出題の文字列に、例示のとおり五十音表で文字をずらす変換を適用すると単語になります。
          頭の中の五十音表だけで変換して、できた単語を入力してください。
        </p>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {pool === null && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {game.question !== null && (
          <>
            <TrainingStatsBar stats={game.stats} />
            <div className="card kt-board">
              <div className="ks-rule">
                <span className="ks-rule-example">{game.question.rule.example}</span>
                <span className="muted">（{game.question.rule.label}）</span>
              </div>
              <div className="q-chips">
                {[...game.question.shown].map((char, i) => (
                  <span className="q-chip" key={i}>
                    {char}
                  </span>
                ))}
              </div>
              <TrainingAnswerPanel
                game={game}
                placeholder={`ひらがな${[...game.question.answer].length}文字`}
                answer={game.question.answer}
              />
            </div>
          </>
        )}
      </main>
    </>
  )
}

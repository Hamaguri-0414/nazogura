import { useEffect, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import {
  TrainingAnswerPanel,
  TrainingStatsBar,
  useTrainingGame,
} from '../components/TrainingGame'
import { toBase, toLargeKana } from '../shared/normalize'
import {
  filterAnagramWords,
  isAnagramAnswer,
  shuffleWord,
} from '../shared/anagram'

interface AnagramQuestion {
  word: string
  shuffled: string
}

export function App() {
  const [pool, setPool] = useState<string[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // 別解判定用の辞書（プールと同じ単語集合）
  const dictRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    fetch(`${base}data/words/core.txt`)
      .then((r) => {
        if (!r.ok) throw new Error('core.txt')
        return r.text()
      })
      .then((text) => {
        const words = filterAnagramWords(text.split('\n'))
        dictRef.current = new Set(words)
        setPool(words)
      })
      .catch((err: Error) => setLoadError(`読み込みに失敗しました（${err.message}）`))
  }, [])

  const game = useTrainingGame<string, AnagramQuestion>(pool, {
    makeQuestion: (word) => ({ word, shuffled: shuffleWord(word) }),
    isCorrect: (q, answer) => isAnagramAnswer(q.word, answer, dictRef.current),
  })

  return (
    <>
      <SiteHeader />
      <main className="an-main">
        <h1>アナグラムトレーニング</h1>
        <p className="lead">
          バラバラに並んだ文字を並べ替えると単語になります。
          並べ替えてできた単語を入力してください（同じ文字構成の単語なら別解も正解です）。
        </p>

        {loadError !== null && <p className="field-error">{loadError}</p>}
        {pool === null && loadError === null && (
          <p className="loading">読み込んでいます…</p>
        )}

        {game.question !== null && (
          <>
            <TrainingStatsBar stats={game.stats} />
            <div className="card kt-board">
              <div className="q-chips">
                {[...game.question.shuffled].map((char, i) => (
                  <span className="q-chip" key={i}>
                    {char}
                  </span>
                ))}
              </div>
              <TrainingAnswerPanel
                game={game}
                placeholder={`ひらがな${[...game.question.word].length}文字`}
                answer={
                  game.phase === 'correct'
                    ? toLargeKana(toBase(game.input.trim()))
                    : game.question.word
                }
              />
            </div>
          </>
        )}
      </main>
    </>
  )
}

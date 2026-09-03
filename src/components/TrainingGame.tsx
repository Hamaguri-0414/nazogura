import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toBase, toLargeKana } from '../shared/normalize'

/** 直近の出題と重複しないよう記憶する問題数 */
const RECENT_LIMIT = 20

export type TrainingPhase = 'answering' | 'correct' | 'revealed'

export interface TrainingStats {
  asked: number
  correct: number
  streak: number
  bestStreak: number
}

const INITIAL_STATS: TrainingStats = {
  asked: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
}

interface TrainingGameOptions<I, Q> {
  /** 出題元アイテムから問題を組み立てる（乱数を使ってよい） */
  makeQuestion: (item: I) => Q
  /**
   * 正誤判定。answer は trim・toBase・小書き→並字の正規化済み
   * （単語辞書は拗音・促音を並字で収録しているため、入力側を寄せる）
   */
  isCorrect: (question: Q, answer: string) => boolean
  /** 直近出題の重複チェックに使うキー（省略時は String(item)） */
  itemKey?: (item: I) => string
}

export interface TrainingGame<Q> {
  question: Q | null
  phase: TrainingPhase
  input: string
  wrong: boolean
  stats: TrainingStats
  setInput: (value: string) => void
  submit: () => void
  reveal: () => void
  next: () => void
}

function pickItem<I>(pool: I[], recent: string[], key: (item: I) => string): I {
  for (let i = 0; i < 50; i++) {
    const item = pool[Math.floor(Math.random() * pool.length)]
    if (!recent.includes(key(item))) return item
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * エンドレス出題トレーニング共通の状態管理。
 * 出題プール（pool）が届いたら最初の問題を出し、正解・ギブアップで
 * 統計を更新しながら次の問題へ進める。
 */
export function useTrainingGame<I, Q>(
  pool: I[] | null,
  options: TrainingGameOptions<I, Q>,
): TrainingGame<Q> {
  const [question, setQuestion] = useState<Q | null>(null)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<TrainingPhase>('answering')
  const [wrong, setWrong] = useState(false)
  const [stats, setStats] = useState<TrainingStats>(INITIAL_STATS)
  const recentRef = useRef<string[]>([])
  // makeQuestion 等が毎レンダー新しい関数でも動くよう、refで最新を参照する
  const optionsRef = useRef(options)
  optionsRef.current = options

  const draw = useCallback(
    (currentPool: I[]) => {
      const { makeQuestion, itemKey } = optionsRef.current
      const key = itemKey ?? ((item: I) => String(item))
      const item = pickItem(currentPool, recentRef.current, key)
      recentRef.current = [key(item), ...recentRef.current].slice(0, RECENT_LIMIT)
      setQuestion(makeQuestion(item))
      setInput('')
      setPhase('answering')
      setWrong(false)
    },
    [],
  )

  useEffect(() => {
    if (pool !== null && pool.length > 0) draw(pool)
  }, [pool, draw])

  const submit = useCallback(() => {
    if (question === null || phase !== 'answering') return
    const answer = toLargeKana(toBase(input.trim()))
    if (answer === '') return
    if (optionsRef.current.isCorrect(question, answer)) {
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
  }, [question, phase, input])

  const reveal = useCallback(() => {
    if (phase !== 'answering') return
    setPhase('revealed')
    setStats((s) => ({ ...s, asked: s.asked + 1, streak: 0 }))
  }, [phase])

  const next = useCallback(() => {
    if (pool !== null && pool.length > 0) draw(pool)
  }, [pool, draw])

  const handleInput = useCallback((value: string) => {
    setInput(value)
    setWrong(false)
  }, [])

  return {
    question,
    phase,
    input,
    wrong,
    stats,
    setInput: handleInput,
    submit,
    reveal,
    next,
  }
}

export function TrainingStatsBar({ stats }: { stats: TrainingStats }) {
  return (
    <div className="kt-stats muted">
      <span>
        正解 {stats.correct} / {stats.asked} 問
      </span>
      <span>連続正解 {stats.streak}</span>
      <span>最高連続 {stats.bestStreak}</span>
    </div>
  )
}

interface AnswerPanelProps {
  game: TrainingGame<unknown>
  placeholder: string
  /** 結果表示に出す答え（正解・答えを見る、の両方で使う） */
  answer: ReactNode
}

/** 解答入力欄・結果表示・次へ/ギブアップボタンの共通UI */
export function TrainingAnswerPanel({ game, placeholder, answer }: AnswerPanelProps) {
  const done = game.phase !== 'answering'
  return (
    <div className="kt-answer">
      {game.phase === 'correct' && (
        <p className="kt-result correct">
          正解！ <strong>{answer}</strong>
        </p>
      )}
      {game.phase === 'revealed' && (
        <p className="kt-result revealed">
          答えは <strong>{answer}</strong> でした
        </p>
      )}
      {done ? (
        <button className="primary" onClick={game.next} autoFocus>
          次の問題へ
        </button>
      ) : (
        <>
          <div className="kt-input-row">
            <input
              type="text"
              className={game.wrong ? 'invalid' : undefined}
              value={game.input}
              placeholder={placeholder}
              autoFocus
              onChange={(e) => game.setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  game.submit()
                }
              }}
            />
            <button className="primary" onClick={game.submit}>
              解答
            </button>
          </div>
          {game.wrong && <p className="field-error">不正解…もう一度！</p>}
          <button className="kt-giveup" onClick={game.reveal}>
            答えを見る
          </button>
        </>
      )}
    </div>
  )
}

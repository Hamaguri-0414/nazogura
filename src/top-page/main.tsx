import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SiteHeader } from '../components/SiteHeader'
import '../styles/site.css'

function TopPage() {
  const base = import.meta.env.BASE_URL
  return (
    <>
      <SiteHeader />
      <main>
        <h2 className="section-heading">制作支援ツール</h2>
        <a className="card tool-card" href={`${base}tools/theme-reverse-search/`}>
          <h3>テーマ逆引き検索</h3>
          <p className="muted">
            答えにしたい単語から、その単語を1文字ずつ拾って作れる「テーマ」（指の名前、曜日など）を逆引きします。
          </p>
        </a>
        <a className="card tool-card" href={`${base}tools/theme-word-list/`}>
          <h3>テーマ別単語リスト</h3>
          <p className="muted">
            各テーマの要素から1文字ずつ拾って作れる単語を、豚辞書・一般辞書・コア辞書から探して一覧します。
          </p>
        </a>
        <h2 className="section-heading">能力向上ツール</h2>
        <a className="card tool-card" href={`${base}tools/kana-pickup-training/`}>
          <h3>五十音文字拾いトレーニング</h3>
          <p className="muted">
            五十音表に置かれた丸数字を順に拾って単語を導く練習を、エンドレスで繰り返せます。
          </p>
        </a>
        <a className="card tool-card" href={`${base}tools/kana-shift-training/`}>
          <h3>五十音シフトトレーニング</h3>
          <p className="muted">
            「あ→い」のように五十音表で文字をずらす変換を、頭の中の五十音表だけで速く戻す練習です。
          </p>
        </a>
        <a className="card tool-card" href={`${base}tools/anagram-training/`}>
          <h3>アナグラムトレーニング</h3>
          <p className="muted">
            バラバラに並んだ文字を並べ替えて単語に戻す練習です。拾った文字から答えを組み立てる力を鍛えます。
          </p>
        </a>
      </main>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TopPage />
  </StrictMode>,
)

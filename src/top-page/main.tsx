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
        <h1>謎解き制作支援ツール</h1>
        <p className="lead">謎解き制作のこまごまとした作業を手伝うツールを集めていきます。</p>
        <a className="card tool-card" href={`${base}tools/theme-reverse-search/`}>
          <h2>テーマ逆引き検索</h2>
          <p className="muted">
            答えにしたい単語から、その単語を1文字ずつ拾って作れる「テーマ」（指の名前、曜日など）を逆引きします。
          </p>
        </a>
        <a className="card tool-card" href={`${base}tools/theme-word-list/`}>
          <h2>テーマ別単語リスト</h2>
          <p className="muted">
            各テーマの要素から1文字ずつ拾って作れる単語を、豚辞書・一般辞書・コア辞書から探して一覧します。
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

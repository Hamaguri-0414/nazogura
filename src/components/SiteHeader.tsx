export function SiteHeader() {
  const base = import.meta.env.BASE_URL
  return (
    <header className="site-header">
      <a className="brand" href={base}>
        謎蔵 <span>謎解き制作支援ツール</span>
      </a>
      <nav>
        <a href={`${base}tools/theme-reverse-search/`}>テーマ逆引き検索</a>
      </nav>
    </header>
  )
}

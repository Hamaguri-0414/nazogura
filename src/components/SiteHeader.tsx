export function SiteHeader() {
  const base = import.meta.env.BASE_URL
  return (
    <header className="site-header">
      <a className="brand" href={base}>
        謎蔵 -なぞぐら- <span>| 謎解き制作支援ツール</span>
      </a>
    </header>
  )
}

export function SiteHeader() {
  const base = import.meta.env.BASE_URL
  return (
    <header className="site-header">
      <a className="brand" href={base}>
        謎蔵 -なぞぐら-
      </a>
    </header>
  )
}

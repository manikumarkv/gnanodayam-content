import { listPublishedKeys } from '@/lib/know-more'

// The content site for gnanodayam.com: an editor (/keystatic) and a JSON API the app reads.
export default async function Home() {
  const keys = await listPublishedKeys()
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
      <h1>Gnanodayam content</h1>
      <p>
        “Know more” docs for <a href="https://gnanodayam.com">gnanodayam.com</a>. Edit them in{' '}
        <a href="/keystatic">the editor</a>.
      </p>
      <h2>Published docs ({keys.length})</h2>
      <ul>
        {keys.map((k) => (
          <li key={k}>
            <a href={`/api/know-more/${k}`}>{k}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}

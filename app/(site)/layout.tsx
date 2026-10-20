export const metadata = { title: 'Gnanodayam content', robots: { index: false } }

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '48px 20px' }}>
        {children}
      </body>
    </html>
  )
}

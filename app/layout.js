export const metadata = {
  title: 'Yorisoi',
  description: 'あなたの心に寄り添うアプリ',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}

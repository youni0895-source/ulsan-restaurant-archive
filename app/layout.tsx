import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '울산 맛집 아카이브',
  description: '네이버지도/카카오맵 공유 링크로 맛집을 모으는 사이트',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

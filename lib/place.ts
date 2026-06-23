export const districts = ['전체', '남구', '중구', '동구', '북구', '울주군'] as const
export type District = typeof districts[number]

export function getDistrict(address: string) {
  if (address.includes('울주군')) return '울주군'
  if (address.includes('남구')) return '남구'
  if (address.includes('중구')) return '중구'
  if (address.includes('동구')) return '동구'
  if (address.includes('북구')) return '북구'
  return '기타'
}

export function cleanHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim()
}

export function pickSearchText(input: string) {
  try {
    const url = new URL(input)
    const decoded = decodeURIComponent(url.href)
    const match = decoded.match(/[가-힣A-Za-z0-9\s·&()'\-]+/g)
    return match?.join(' ').replace(/https?|naver|kakao|map|place|maps|com|co|kr|m\./gi, ' ').replace(/\s+/g, ' ').trim() || input
  } catch {
    return input
  }
}

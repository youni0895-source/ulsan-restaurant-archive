import { NextResponse } from 'next/server'
import { cleanHtml, getDistrict, pickSearchText } from '@/lib/place'

async function getFinalUrl(url: string) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return res.url || url
  } catch {
    return url
  }
}

async function kakaoKeywordSearch(query: string) {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) throw new Error('KAKAO_REST_API_KEY가 없습니다.')

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
    { headers: { Authorization: `KakaoAK ${key}` }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error('카카오 장소 검색에 실패했습니다.')
  const data = await res.json()
  return data.documents || []
}

async function kakaoAddressSearch(query: string) {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) throw new Error('KAKAO_REST_API_KEY가 없습니다.')

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `KakaoAK ${key}` }, cache: 'no-store' }
  )
  if (!res.ok) throw new Error('카카오 주소 검색에 실패했습니다.')
  const data = await res.json()
  return data.documents || []
}

function extractNaverPlaceId(url: string) {
  const decoded = decodeURIComponent(url)
  const match = decoded.match(/place\/(\d+)/)
  return match?.[1]
}

function extractKakaoPlaceId(url: string) {
  const decoded = decodeURIComponent(url)
  const match = decoded.match(/place\.map\.kakao\.com\/(\d+)/) || decoded.match(/places?\/(\d+)/)
  return match?.[1]
}

export async function POST(req: Request) {
  try {
    const { mapUrl } = await req.json()
    if (!mapUrl || typeof mapUrl !== 'string') {
      return NextResponse.json({ error: '지도 링크를 입력해 주세요.' }, { status: 400 })
    }

    const finalUrl = await getFinalUrl(mapUrl)
    const searchText = pickSearchText(finalUrl)
    const naverId = extractNaverPlaceId(finalUrl)
    const kakaoId = extractKakaoPlaceId(finalUrl)

    // 카카오 장소 링크는 숫자 id가 포함된 경우 페이지 URL을 그대로 보관하고, 검색어는 URL 문자에서 추출합니다.
    // 네이버 링크는 공식 장소 상세 API가 없어 링크 텍스트/최종 URL 기반으로 카카오 검색을 보완합니다.
    let documents = await kakaoKeywordSearch(searchText)

    if (documents.length === 0 && (naverId || kakaoId)) {
      documents = await kakaoKeywordSearch(`${naverId || kakaoId} 울산`)
    }

    if (documents.length === 0) {
      const addrDocs = await kakaoAddressSearch(searchText)
      if (addrDocs.length > 0) {
        const address = addrDocs[0].road_address?.address_name || addrDocs[0].address_name
        return NextResponse.json({
          name: addrDocs[0].address?.main_address_no ? '이름 확인 필요' : '이름 확인 필요',
          address,
          district: getDistrict(address),
          map_url: mapUrl,
          needsNameCheck: true,
        })
      }
      return NextResponse.json({ error: '장소를 찾지 못했어요. 카카오맵 공유 링크나 장소명이 포함된 링크로 다시 시도해 주세요.' }, { status: 404 })
    }

    const first = documents.find((d: any) => (d.road_address_name || d.address_name || '').includes('울산')) || documents[0]
    const address = first.road_address_name || first.address_name || ''

    return NextResponse.json({
      name: cleanHtml(first.place_name || '이름 확인 필요'),
      address,
      district: getDistrict(address),
      map_url: mapUrl,
      kakao_place_url: first.place_url,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '오류가 발생했어요.' }, { status: 500 })
  }
}

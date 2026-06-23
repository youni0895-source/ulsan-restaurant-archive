'use client'

import { useEffect, useMemo, useState } from 'react'
// import { MapPin, Plus, Search, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { districts } from '@/lib/place'

type Restaurant = {
  id: string
  map_url: string
  name: string
  address: string
  district: string
  created_at: string
}

type Preview = {
  map_url: string
  name: string
  address: string
  district: string
  kakao_place_url?: string
  needsNameCheck?: boolean
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [mapUrl, setMapUrl] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [filter, setFilter] = useState('전체')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setRestaurants(data)
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  const filtered = useMemo(() => {
    if (filter === '전체') return restaurants
    return restaurants.filter((r) => r.district === filter)
  }, [restaurants, filter])

  async function resolvePlace() {
    setError('')
    setPreview(null)
    if (!mapUrl.trim()) {
      setError('지도 공유 링크를 붙여넣어 주세요.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/resolve-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapUrl: mapUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '장소 확인에 실패했어요.')
      setPreview(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function savePlace() {
    if (!preview) return
    setSaving(true)
    setError('')
    try {
      const { error } = await supabase.from('restaurants').insert({
        map_url: preview.map_url,
        name: preview.name,
        address: preview.address,
        district: preview.district,
      })
      if (error) throw error
      setMapUrl('')
      setPreview(null)
      await loadRestaurants()
    } catch (e: any) {
      setError(e.message || '저장에 실패했어요. Supabase RLS 정책을 확인해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main>
      <section className="header container">
        <div className="badge">
  울산 맛집 공유 저장소
</div>
        <h1>울산 맛집 아카이브</h1>
        <p className="subtitle">네이버지도 또는 카카오맵에서 공유 링크를 복사해 붙여넣으면 가게 이름과 주소, 구·군을 정리해서 모두가 볼 수 있어요.</p>
      </section>

      <section className="container panel">
        <div className="form">
          <input
            className="input"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="네이버지도/카카오맵 공유 링크를 붙여넣어 주세요"
          />
          <button className="btn" onClick={resolvePlace} disabled={loading}>{loading ? '확인 중...' : '장소 확인'}</button>
        </div>
        <p className="hint">카카오맵 링크가 가장 정확해요. 네이버지도 링크는 일부 링크에서 장소명이 정확히 안 잡힐 수 있어요.</p>
        {error && <div className="error">{error}</div>}

        {preview && (
          <div className="preview">
            <div className="preview-title">{preview.name}</div>
           <div className="addr">
  {preview.address}
</div>
            <button ...>
  등록하기
</button>
              <span className="tag">{preview.district}</span>
              <button className="btn" onClick={savePlace} disabled={saving}>{saving ? '저장 중...' : <><Plus size={16} style={{ verticalAlign: 'middle' }} /> 등록하기</>}</button>
            </div>
          </div>
        )}
      </section>

      <section className="container">
        <div className="filters">
          {districts.map((d) => (
            <button key={d} className={`filter ${filter === d ? 'active' : ''}`} onClick={() => setFilter(d)}>
              {d}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><Search size={32} /><p>아직 등록된 맛집이 없어요.</p></div>
        ) : (
          <div className="grid">
            {filtered.map((r) => (
              <article className="card" key={r.id}>
                <h3>{r.name}</h3>
                <div className="addr">{r.address}</div>
                <div className="meta">
                  <span className="tag">{r.district}</span>
                  <span>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

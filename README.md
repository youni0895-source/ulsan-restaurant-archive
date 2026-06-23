# 울산 맛집 아카이브

네이버지도/카카오맵 공유 링크를 입력하면 맛집 이름, 주소, 구·군을 목록으로 저장하는 Next.js + Supabase 프로젝트입니다.

## Supabase SQL

SQL Editor에서 아래를 실행하세요.

```sql
create table if not exists restaurants (
  id uuid default gen_random_uuid() primary key,
  map_url text not null,
  name text not null,
  address text not null,
  district text not null,
  created_at timestamp with time zone default now()
);

alter table restaurants enable row level security;

create policy "Anyone can read restaurants"
on restaurants for select
using (true);

create policy "Anyone can insert restaurants"
on restaurants for insert
with check (true);
```

## Vercel 환경변수

Vercel Project Settings > Environment Variables에 아래를 추가하세요.

```env
NEXT_PUBLIC_SUPABASE_URL=https://본인프로젝트.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabase publishable key
KAKAO_REST_API_KEY=카카오 REST API 키
```

## 주의

카카오맵 공유 링크가 가장 정확합니다. 네이버지도 링크는 공식 장소 상세 API가 없어 일부 링크에서 장소명 인식이 제한될 수 있습니다.

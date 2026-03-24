# Cloudflare Pages에 배포하기

이 프로젝트는 **Cloudflare Pages**로 배포할 수 있도록 `@cloudflare/next-on-pages`와 `wrangler`가 설정되어 있습니다.

---

## 1. 사전 준비

- **Node.js** 18+
- **npm** 또는 **pnpm**
- **Cloudflare 계정** (무료): [dash.cloudflare.com](https://dash.cloudflare.com)
- **Wrangler CLI** 로그인: 터미널에서 `npx wrangler login`

---

## 2. 로컬에서 빌드 & 배포

### 2-1. 환경 변수 (선택)

Cloudflare Pages는 빌드 시·런타임에 환경 변수를 넣을 수 있습니다.  
로컬에서 배포할 때는 `.env`를 쓰고, **Cloudflare 대시보드**에서 배포할 때는 아래 3단계처럼 Pages 설정에 넣습니다.

### 2-2. 빌드 후 배포

```bash
cd /Users/engz/Desktop/Dontforget

# 의존성 설치
npm install

# Cloudflare용 빌드 (Next.js → .vercel/output)
npm run pages:build

# Cloudflare Pages에 배포 (로그인 필요 시: npx wrangler login)
npm run deploy
```

또는 한 번에:

```bash
npm run pages:build && npx wrangler pages deploy .vercel/output
```

배포가 끝나면 `https://<프로젝트명>.pages.dev` 형태의 URL이 나옵니다.

---

## 3. GitHub 연동으로 자동 배포 (권장)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. **GitHub** 선택 후 이 저장소 연결
3. **Build configuration**
   - **Framework preset**: Next.js (Static HTML) 또는 None
   - **Install command**: `npm install --legacy-peer-deps`  
     → `@cloudflare/next-on-pages`와 `next@14.2.x` peer 충돌을 피하기 위해 필수
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output`
4. **Environment variables** (Settings → Environment variables)에 아래 추가:

| 변수명 | 값 | 비고 |
|--------|-----|------|
| `DATABASE_URL` | 프로덕션 DB URL | SQLite 파일 대신 **Neon·Turso·D1** 등 클라우드 DB 필요 |
| `NEXTAUTH_URL` | `https://<프로젝트명>.pages.dev` | 배포 후 실제 URL로 수정 |
| `NEXTAUTH_SECRET` | 랜덤 문자열 | `openssl rand -base64 32` |
| `JWT_SECRET` | 랜덤 문자열 | |
| `GOOGLE_CLIENT_ID` | (로컬 .env와 동일) | |
| `GOOGLE_CLIENT_SECRET` | (로컬 .env와 동일) | |
| `KAKAO_CLIENT_ID` | (로컬 .env와 동일) | |
| `KAKAO_CLIENT_SECRET` | (로컬 .env와 동일) | |

5. **Save** 후 배포가 자동으로 실행됩니다.  
   이후에는 해당 브랜치에 `git push` 할 때마다 자동 배포됩니다.

---

## 4. DB (데이터베이스) 안내

로컬의 `file:./dev.db` (SQLite 파일)는 Cloudflare 환경에서 사용할 수 없습니다.

- **Cloudflare D1** (SQLite 호환): 대시보드에서 D1 DB 생성 후 `wrangler.toml`에 바인딩
- **Neon** (PostgreSQL): [neon.tech](https://neon.tech)에서 DB 생성 후 `DATABASE_URL`에 연결 문자열 입력  
  → 이 경우 Prisma `schema.prisma`를 `postgresql`로 바꾸고 마이그레이션 필요
- **Turso** (SQLite 호환, edge): HTTP로 접근 가능해 Pages와 함께 사용 가능

원하면 D1 또는 Neon 기준으로 `schema.prisma` 수정·마이그레이션 단계도 정리해 드릴 수 있습니다.

---

## 5. OAuth (카카오/구글) 리다이렉트

배포된 URL(예: `https://dontforget.pages.dev`)을 각 OAuth 앱에 등록해야 합니다.

- **Google**: [Google Cloud Console](https://console.cloud.google.com) → 사용 중인 OAuth 클라이언트 → **승인된 리디렉션 URI**에  
  `https://<프로젝트명>.pages.dev/api/auth/callback/google` 추가
- **카카오**: [Kakao Developers](https://developers.kakao.com) → 앱 설정 → **Redirect URI**에  
  `https://<프로젝트명>.pages.dev/api/auth/callback/kakao` 추가

---

## 요약

| 방법 | 명령 / 절차 |
|------|-------------|
| 로컬에서 한 번 배포 | `npm run pages:build` → `npm run deploy` (또는 `npx wrangler pages deploy .vercel/output`) |
| GitHub 푸시 시 자동 배포 | Cloudflare Pages에서 저장소 연결, Build command: `npm run pages:build`, Build output: `.vercel/output`, 환경 변수 설정 |

배포 후 `https://<프로젝트명>.pages.dev` 로 접속하면 됩니다.

# 깜냥 수첩 배포 가이드

## 1. GitHub에 푸시 (로컬에서 실행)

커밋은 이미 되어 있습니다. 아래만 터미널에서 실행하세요.

```bash
cd /Users/engz/Desktop/Dontforget
git push origin claude/english-vocab-learning-app-C0QLN
```

GitHub 로그인/토큰 요구 시:
- **HTTPS**: GitHub → Settings → Developer settings → Personal access tokens 에서 토큰 생성 후 비밀번호 대신 입력
- **SSH**: `git remote set-url origin git@github.com:사용자명/저장소명.git` 후 `git push origin claude/english-vocab-learning-app-C0QLN`

---

## 2. GitHub Pages가 아닌 이유

**GitHub Pages**는 **정적 파일만** 호스팅합니다.  
이 프로젝트는 다음이 필요해 **Pages만으로는 동작하지 않습니다**.

- 서버 API (`/api/words`, `/api/auth`, …)
- DB (Prisma)
- 로그인(NextAuth) 세션

그래서 **서버가 돌아가는 호스팅**이 필요합니다.

---

## 3. 실제 사이트/앱 배포

### 3-A. Cloudflare Pages (권장)

이 프로젝트는 **Cloudflare Pages** 배포용으로 설정되어 있습니다.

- **상세 절차**: **[DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)** 참고
- **한 줄 요약**:  
  - 로컬 배포: `npm run pages:build` 후 `npm run deploy`  
  - 자동 배포: Cloudflare 대시보드에서 GitHub 저장소 연결 → Build command: `npm run pages:build`, Build output: `.vercel/output`

### 3-B. Vercel (대안)

**Vercel**은 Next.js를 그대로 지원하고, 무료 플랜으로 배포할 수 있습니다.

**Vercel 연결**

1. [vercel.com](https://vercel.com) 가입 후 로그인
2. **Add New** → **Project**
3. **Import Git Repository**에서 이 프로젝트 GitHub 저장소 선택
4. Branch: `claude/english-vocab-learning-app-C0QLN` (또는 사용하는 브랜치)
5. **Deploy** 클릭

첫 배포는 실패할 수 있습니다. **환경 변수**와 **DB** 설정이 필요하기 때문입니다.

**환경 변수 설정** (Vercel 대시보드)

프로젝트 → **Settings** → **Environment Variables**에서 아래를 추가하세요.

| 이름 | 값 | 비고 |
|------|-----|------|
| `DATABASE_URL` | 프로덕션 DB URL | 로컬 `file:./dev.db` 대신 **클라우드 DB** 필요 (아래 참고) |
| `NEXTAUTH_URL` | `https://프로젝트명.vercel.app` | 배포 후 실제 도메인으로 수정 |
| `NEXTAUTH_SECRET` | 랜덤 문자열 | `openssl rand -base64 32` 로 생성 |
| `JWT_SECRET` | 랜덤 문자열 | NEXTAUTH_SECRET 과 동일해도 됨 |
| `GOOGLE_CLIENT_ID` | (로컬 .env 와 동일) | |
| `GOOGLE_CLIENT_SECRET` | (로컬 .env 와 동일) | |
| `KAKAO_CLIENT_ID` | (로컬 .env 와 동일) | |
| `KAKAO_CLIENT_SECRET` | (로컬 .env 와 동일) | 카카오 개발자 콘솔에서 확인 |
| `OPENAI_API_KEY` | (선택) AI 예문/번역용 | 없으면 해당 기능만 비활성화 |

**프로덕션 DB** (필수)

로컬의 `file:./dev.db`는 Vercel에 없으므로 **외부 DB**가 필요합니다.

- **Neon** (무료): [neon.tech](https://neon.tech) → PostgreSQL 생성 후 Connection string 을 `DATABASE_URL` 에 넣기  
  - Prisma 에서 PostgreSQL 쓰려면 `schema.prisma` 의 `provider` 를 `postgresql` 로 바꾸고, `prisma migrate` 등 적용 필요
- **PlanetScale** (MySQL 호환)
- **Supabase** (PostgreSQL)

지금은 **SQLite**이므로, PostgreSQL로 바꾸면 `prisma/schema.prisma` 의 `datasource`와 `provider` 수정이 필요합니다. 원하면 그 단계도 정리해 드릴 수 있습니다.

**OAuth 리다이렉트 URI 등록**

배포된 URL(예: `https://xxx.vercel.app`)을 다음에 등록하세요.

- **Google**: [Google Cloud Console](https://console.cloud.google.com) → 해당 OAuth 클라이언트 → 승인된 리디렉션 URI 에  
  `https://xxx.vercel.app/api/auth/callback/google` 추가
- **카카오**: [Kakao Developers](https://developers.kakao.com) → 앱 설정 → Redirect URI 에  
  `https://xxx.vercel.app/api/auth/callback/kakao` 추가

이후 **Redeploy** 하면 로그인까지 동작하는 실제 사이트/앱이 나옵니다.

---

## 요약

1. **푸시**: 위 1번처럼 `git push` 만 로컬에서 실행
2. **배포**: **Cloudflare Pages** → [DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md) 참고 (또는 Vercel 사용 가능)
3. **동작을 위해**: 환경 변수 + 프로덕션 DB + OAuth 리다이렉트 URI 설정

DB를 PostgreSQL(Neon) 또는 D1로 바꾸는 작업이 필요하면 말해 주세요.

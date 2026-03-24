import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

// Edge/미들웨어용 설정 (Prisma·bcrypt 미사용). auth.ts에서 확장해 사용.
export default {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/', error: '/' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    {
      id: 'kakao',
      name: 'Kakao',
      type: 'oauth',
      authorization: {
        url: 'https://kauth.kakao.com/oauth/authorize',
        params: { scope: 'profile_nickname account_email' },
      },
      token: {
        url: 'https://kauth.kakao.com/oauth/token',
        conform: async (response: Response) => {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('content-type', 'application/json')
          return new Response(response.body, { status: response.status, headers: newHeaders })
        },
      },
      userinfo: 'https://kapi.kakao.com/v2/user/me',
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      client: { token_endpoint_auth_method: 'client_secret_post' },
      profile(profile: { id: number; kakao_account?: { email?: string; profile?: { nickname?: string } } }) {
        return {
          id: String(profile.id),
          email: profile.kakao_account?.email ?? `kakao_${profile.id}@kakao.local`,
          name: profile.kakao_account?.profile?.nickname ?? `kakao_${profile.id}`,
        }
      },
    },
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string
        session.user.name = token.username as string
      }
      return session
    },
  },
} satisfies NextAuthConfig

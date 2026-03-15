import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import authConfig from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  basePath: '/api/auth',
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) return null
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.username }
      },
    }),
    ...authConfig.providers,
  ],
  callbacks: {
    async signIn({ user, account }) {
      // OAuth 로그인 시 DB에 사용자 자동 생성
      if (account?.provider !== 'credentials') {
        const email = user.email!
        const existing = await prisma.user.findUnique({ where: { email } })
        if (!existing) {
          const { randomBytes } = await import('crypto')
          const tempUsername = `u_${randomBytes(8).toString('hex')}`
          const created = await prisma.user.create({
            data: { email, username: tempUsername, password: null, nicknameSet: false },
          })
          await prisma.vocabLevel.create({ data: { userId: created.id } })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
        if (dbUser) {
          token.userId = dbUser.id
          token.username = dbUser.username
        }
      }
      return token
    },
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string
        session.user.name = token.username as string
      }
      return session
    },
  },
})

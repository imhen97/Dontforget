'use server'

import { signIn } from '@/../auth'

export async function socialSignIn(provider: string) {
  await signIn(provider, { redirectTo: '/dashboard' })
}

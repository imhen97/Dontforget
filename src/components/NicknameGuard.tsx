'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NicknameGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname === '/set-nickname') return

    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (data && data.nicknameSet === false) {
          router.replace('/set-nickname')
        }
      })
      .catch(() => {})
  }, [pathname, router])

  return null
}

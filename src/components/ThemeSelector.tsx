'use client'

import { useEffect } from 'react'

export const THEMES = [
  {
    id: 'cute',
    label: '귀여운',
    vars: {
      '--yellow':  '#fcf6bd',
      '--pink':    '#ff99c8',
      '--purple':  '#e4c1f9',
      '--mint':    '#e4c1f9',
      '--blue':    '#e4c1f9',
      '--ink':     '#1a1a1a',
      '--paper':   '#ffffff',
    },
  },
  {
    id: 'chic',
    label: '세련된',
    vars: {
      '--yellow':  '#f5ede0',
      '--pink':    '#c4866a',
      '--purple':  '#a8bfa8',
      '--mint':    '#a8bfa8',
      '--blue':    '#a8bfa8',
      '--ink':     '#2c1c10',
      '--paper':   '#fefaf5',
    },
  },
  {
    id: 'modern',
    label: '모던',
    vars: {
      '--yellow':  '#e2e8f0',
      '--pink':    '#4f46e5',
      '--purple':  '#818cf8',
      '--mint':    '#818cf8',
      '--blue':    '#818cf8',
      '--ink':     '#1e1b4b',
      '--paper':   '#ffffff',
    },
  },
]

export function applyTheme(id: string) {
  const theme = THEMES.find(t => t.id === id) ?? THEMES[0]
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val))
  document.body.style.backgroundColor = theme.vars['--yellow']
}

// 레이아웃에서 저장된 테마를 자동 적용하는 headless 컴포넌트
export default function ThemeSelector() {
  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'cute'
    applyTheme(saved)
  }, [])
  return null
}

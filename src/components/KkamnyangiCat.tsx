'use client'

interface KkamnyangiCatProps {
  equippedItems?: Record<string, string>
  size?: number
}

export default function KkamnyangiCat({ equippedItems = {}, size = 120 }: KkamnyangiCatProps) {
  const hat = equippedItems['hat']
  const accessory = equippedItems['accessory']

  const scale = size / 120

  return (
    <svg
      width={size}
      height={size * (170 / 120)}
      viewBox="0 0 120 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── BODY ── */}
      <ellipse cx="60" cy="120" rx="32" ry="36" fill="#1a1a1a" />

      {/* ── TAIL ── */}
      <path
        d="M90 148 Q115 140 112 120 Q110 108 100 112"
        stroke="#1a1a1a"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── FRONT PAWS ── */}
      <ellipse cx="43" cy="154" rx="10" ry="7" fill="#1a1a1a" />
      <ellipse cx="77" cy="154" rx="10" ry="7" fill="#1a1a1a" />

      {/* ── HEAD ── */}
      <ellipse cx="60" cy="68" rx="30" ry="28" fill="#1a1a1a" />

      {/* ── EARS ── */}
      <polygon points="36,48 28,22 50,40" fill="#1a1a1a" />
      <polygon points="84,48 92,22 70,40" fill="#1a1a1a" />
      {/* inner ear */}
      <polygon points="38,46 32,28 48,41" fill="#ff99c8" opacity="0.7" />
      <polygon points="82,46 88,28 72,41" fill="#ff99c8" opacity="0.7" />

      {/* ── FACE ── */}
      {/* Eyes */}
      <ellipse cx="48" cy="64" rx="5" ry="6" fill="#fcf6bd" />
      <ellipse cx="72" cy="64" rx="5" ry="6" fill="#fcf6bd" />
      <ellipse cx="49" cy="65" rx="3" ry="4" fill="#1a1a1a" />
      <ellipse cx="73" cy="65" rx="3" ry="4" fill="#1a1a1a" />
      {/* eye shine */}
      <circle cx="50" cy="63" r="1.2" fill="white" />
      <circle cx="74" cy="63" r="1.2" fill="white" />

      {/* Nose */}
      <polygon points="60,73 57,77 63,77" fill="#ff99c8" />

      {/* Mouth */}
      <path d="M57,77 Q60,81 63,77" stroke="#ff99c8" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Whiskers */}
      <line x1="30" y1="73" x2="52" y2="74" stroke="#888" strokeWidth="1" />
      <line x1="30" y1="77" x2="52" y2="76" strokeWidth="1" stroke="#888" />
      <line x1="68" y1="74" x2="90" y2="73" strokeWidth="1" stroke="#888" />
      <line x1="68" y1="76" x2="90" y2="77" strokeWidth="1" stroke="#888" />

      {/* ── BELLY PATCH ── */}
      <ellipse cx="60" cy="118" rx="18" ry="22" fill="#2a2a2a" />

      {/* ══ ACCESSORY LAYER ══ */}
      {accessory === 'acc_ribbon' && (
        <g>
          {/* Pink ribbon on neck */}
          <path d="M48,92 Q60,98 72,92" stroke="#ff99c8" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="93" r="4" fill="#ff99c8" />
          <path d="M56,91 L52,86 L60,93 L52,91 Z" fill="#ff99c8" />
          <path d="M64,91 L68,86 L60,93 L68,91 Z" fill="#ff99c8" />
        </g>
      )}
      {accessory === 'acc_glasses' && (
        <g>
          {/* Round glasses */}
          <circle cx="48" cy="64" r="8" stroke="#a9def9" strokeWidth="2" fill="none" />
          <circle cx="72" cy="64" r="8" stroke="#a9def9" strokeWidth="2" fill="none" />
          <line x1="56" y1="64" x2="64" y2="64" stroke="#a9def9" strokeWidth="2" />
          <line x1="28" y1="62" x2="40" y2="63" stroke="#a9def9" strokeWidth="1.5" />
          <line x1="80" y1="63" x2="92" y2="62" stroke="#a9def9" strokeWidth="1.5" />
        </g>
      )}
      {accessory === 'acc_bowtie' && (
        <g>
          {/* Bow tie at neck */}
          <path d="M52,90 L60,95 L68,90 L60,95 Z" fill="#a9def9" />
          <path d="M52,100 L60,95 L68,100 L60,95 Z" fill="#a9def9" />
          <circle cx="60" cy="95" r="3" fill="#1a1a1a" />
        </g>
      )}

      {/* ══ HAT LAYER ══ */}
      {hat === 'hat_crown' && (
        <g>
          {/* Gold crown */}
          <rect x="40" y="32" width="40" height="14" rx="2" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1" />
          <polygon points="40,32 47,18 54,32" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1" />
          <polygon points="53,32 60,16 67,32" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1" />
          <polygon points="66,32 73,18 80,32" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1" />
          <circle cx="60" cy="26" r="3" fill="#ff99c8" />
          <circle cx="47" cy="28" r="2" fill="#a9def9" />
          <circle cx="73" cy="28" r="2" fill="#d0f4de" />
        </g>
      )}
      {hat === 'hat_witch' && (
        <g>
          {/* Witch hat */}
          <ellipse cx="60" cy="40" rx="24" ry="6" fill="#2a1a2a" />
          <polygon points="60,5 42,40 78,40" fill="#2a1a2a" />
          <ellipse cx="60" cy="40" rx="24" ry="6" fill="#2a1a2a" />
          {/* hat band */}
          <rect x="38" y="35" width="44" height="5" rx="2" fill="#e4c1f9" />
          {/* star */}
          <text x="55" y="28" fontSize="10" fill="#fcf6bd">★</text>
        </g>
      )}
      {hat === 'hat_strawberry' && (
        <g>
          {/* Strawberry hat */}
          <ellipse cx="60" cy="38" rx="18" ry="16" fill="#ff6b6b" />
          {/* seeds */}
          <ellipse cx="54" cy="35" rx="1.5" ry="2" fill="#fcf6bd" transform="rotate(-10,54,35)" />
          <ellipse cx="62" cy="32" rx="1.5" ry="2" fill="#fcf6bd" />
          <ellipse cx="67" cy="38" rx="1.5" ry="2" fill="#fcf6bd" transform="rotate(10,67,38)" />
          <ellipse cx="55" cy="43" rx="1.5" ry="2" fill="#fcf6bd" transform="rotate(-5,55,43)" />
          {/* leaves */}
          <path d="M55,24 Q60,18 65,24" fill="#d0f4de" />
          <path d="M52,26 Q55,18 58,24" fill="#d0f4de" />
          <path d="M62,24 Q65,18 68,26" fill="#d0f4de" />
        </g>
      )}
      {hat === 'hat_graduate' && (
        <g>
          {/* Graduation cap */}
          <rect x="44" y="34" width="32" height="8" rx="1" fill="#1a1a2a" />
          <polygon points="60,18 38,34 82,34" fill="#1a1a2a" />
          <polygon points="60,18 82,34 80,38 60,22 40,38 38,34" fill="#2a2a3a" />
          {/* tassel */}
          <line x1="78" y1="34" x2="84" y2="44" stroke="#fcf6bd" strokeWidth="1.5" />
          <circle cx="84" cy="46" r="2" fill="#fcf6bd" />
        </g>
      )}
      {hat === 'hat_santa' && (
        <g>
          {/* Santa hat */}
          <path d="M38,40 Q45,14 60,8 Q72,14 82,40 Z" fill="#e83030" />
          <ellipse cx="60" cy="40" rx="24" ry="7" fill="white" />
          {/* pom pom */}
          <circle cx="62" cy="10" r="6" fill="white" />
        </g>
      )}
    </svg>
  )
}

'use client'

interface KkamnyangiCatProps {
  equippedItems?: Record<string, string>
  size?: number
}

export default function KkamnyangiCat({ equippedItems = {}, size = 120 }: KkamnyangiCatProps) {
  const hat = equippedItems['hat']
  const accessory = equippedItems['accessory']

  return (
    <svg
      width={size}
      height={size * (170 / 120)}
      viewBox="0 0 120 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── BODY (chubby round) ── */}
      <ellipse cx="60" cy="130" rx="38" ry="32" fill="#ffffff"/>

      {/* ── STUBBY ARMS ── */}
      <ellipse cx="18" cy="120" rx="14" ry="9" fill="#ffffff" transform="rotate(-30 18 120)"/>
      <ellipse cx="102" cy="120" rx="14" ry="9" fill="#ffffff" transform="rotate(30 102 120)"/>

      {/* ── HAIR SPIKES ── */}
      <polygon points="30,52 36,28 46,55" fill="#fbff12"/>
      <polygon points="46,44 54,18 62,44" fill="#fbff12"/>
      <polygon points="60,44 68,18 76,44" fill="#fbff12"/>
      <polygon points="76,55 86,28 92,52" fill="#fbff12"/>

      {/* ── HEAD ── */}
      <circle cx="60" cy="72" r="40" fill="#ffffff"/>

      {/* ── EYEBROWS (furrowed/frustrated) ── */}
      <line x1="28" y1="56" x2="46" y2="62" stroke="#0c0f0a" strokeWidth="4" strokeLinecap="round"/>
      <line x1="74" y1="62" x2="92" y2="56" stroke="#0c0f0a" strokeWidth="4" strokeLinecap="round"/>

      {/* ── EYES ── */}
      <circle cx="44" cy="72" r="10" fill="#0c0f0a"/>
      <circle cx="76" cy="72" r="10" fill="#0c0f0a"/>
      <circle cx="47" cy="68" r="3.5" fill="#ffffff"/>
      <circle cx="79" cy="68" r="3.5" fill="#ffffff"/>

      {/* ── CHUBBY CHEEKS ── */}
      <circle cx="20" cy="80" r="10" fill="#ff206e" opacity="0.3"/>
      <circle cx="100" cy="80" r="10" fill="#ff206e" opacity="0.3"/>

      {/* ── NOSE ── */}
      <ellipse cx="60" cy="82" rx="4.5" ry="3.5" fill="#ff206e" opacity="0.6"/>

      {/* ── MOUTH (grimace) ── */}
      <path d="M50 92 Q60 86 70 92" stroke="#0c0f0a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>

      {/* ── SWEAT DROP ── */}
      <path d="M100 20 Q106 30 100 36 Q94 30 100 20Z" fill="#41ead4"/>

      {/* ══ ACCESSORY LAYER ══ */}
      {accessory === 'acc_ribbon' && (
        <g>
          <path d="M44,104 Q60,112 76,104" stroke="#ff206e" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <circle cx="60" cy="105" r="6" fill="#ff206e"/>
          <path d="M54,103 L48,96 L60,105 L48,103 Z" fill="#ff206e"/>
          <path d="M66,103 L72,96 L60,105 L72,103 Z" fill="#ff206e"/>
        </g>
      )}
      {accessory === 'acc_glasses' && (
        <g>
          <circle cx="44" cy="72" r="14" stroke="#41ead4" strokeWidth="3" fill="none"/>
          <circle cx="76" cy="72" r="14" stroke="#41ead4" strokeWidth="3" fill="none"/>
          <line x1="58" y1="72" x2="62" y2="72" stroke="#41ead4" strokeWidth="3"/>
          <line x1="18" y1="70" x2="30" y2="71" stroke="#41ead4" strokeWidth="2.5"/>
          <line x1="90" y1="71" x2="102" y2="70" stroke="#41ead4" strokeWidth="2.5"/>
        </g>
      )}
      {accessory === 'acc_bowtie' && (
        <g>
          <path d="M48,102 L60,110 L72,102 L60,110 Z" fill="#41ead4"/>
          <path d="M48,118 L60,110 L72,118 L60,110 Z" fill="#41ead4"/>
          <circle cx="60" cy="110" r="5" fill="#0c0f0a"/>
        </g>
      )}

      {/* ══ HAT LAYER ══ */}
      {hat === 'hat_crown' && (
        <g>
          <rect x="36" y="24" width="48" height="18" rx="3" fill="#fbff12" stroke="#e8c800" strokeWidth="1.5"/>
          <polygon points="36,24 46,6 56,24" fill="#fbff12" stroke="#e8c800" strokeWidth="1.5"/>
          <polygon points="50,24 60,4 70,24" fill="#fbff12" stroke="#e8c800" strokeWidth="1.5"/>
          <polygon points="64,24 74,6 84,24" fill="#fbff12" stroke="#e8c800" strokeWidth="1.5"/>
          <circle cx="60" cy="16" r="4" fill="#ff206e"/>
          <circle cx="46" cy="20" r="3" fill="#41ead4"/>
          <circle cx="74" cy="20" r="3" fill="#41ead4"/>
        </g>
      )}
      {hat === 'hat_witch' && (
        <g>
          <ellipse cx="60" cy="44" rx="30" ry="8" fill="#161a15"/>
          <polygon points="60,4 38,44 82,44" fill="#161a15"/>
          <rect x="32" y="38" width="56" height="7" rx="3" fill="#fbff12"/>
        </g>
      )}
      {hat === 'hat_strawberry' && (
        <g>
          <ellipse cx="60" cy="40" rx="24" ry="22" fill="#ff206e"/>
          <ellipse cx="52" cy="36" rx="2.5" ry="3.5" fill="#fbff12" transform="rotate(-10,52,36)"/>
          <ellipse cx="62" cy="30" rx="2.5" ry="3.5" fill="#fbff12"/>
          <ellipse cx="68" cy="40" rx="2.5" ry="3.5" fill="#fbff12" transform="rotate(10,68,40)"/>
          <ellipse cx="53" cy="46" rx="2.5" ry="3.5" fill="#fbff12" transform="rotate(-5,53,46)"/>
          <path d="M50,22 Q60,14 70,22" fill="#41ead4"/>
          <path d="M46,25 Q50,14 55,22" fill="#41ead4"/>
          <path d="M65,22 Q70,14 74,25" fill="#41ead4"/>
        </g>
      )}
      {hat === 'hat_graduate' && (
        <g>
          <rect x="40" y="30" width="40" height="12" rx="2" fill="#161a15"/>
          <polygon points="60,8 30,30 90,30" fill="#161a15"/>
          <line x1="86" y1="30" x2="94" y2="46" stroke="#fbff12" strokeWidth="2.5"/>
          <circle cx="94" cy="48" r="3.5" fill="#fbff12"/>
        </g>
      )}
      {hat === 'hat_santa' && (
        <g>
          <path d="M34,44 Q42,14 60,8 Q76,14 86,44 Z" fill="#ff206e"/>
          <ellipse cx="60" cy="44" rx="28" ry="9" fill="white"/>
          <circle cx="62" cy="10" r="8" fill="white"/>
        </g>
      )}
    </svg>
  )
}

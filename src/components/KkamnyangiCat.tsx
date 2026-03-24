'use client'

interface KkamnyangiCatProps {
  equippedItems?: Record<string, string>
  size?: number
  faceOnly?: boolean
}

export default function KkamnyangiCat({ equippedItems = {}, size = 120, faceOnly = false }: KkamnyangiCatProps) {
  const hat = equippedItems['hat']
  const accessory = equippedItems['accessory']

  const viewBox = faceOnly ? '10 6 100 108' : '0 0 120 188'
  const height = faceOnly ? size * 1.08 : size * (188 / 120)

  return (
    <svg width={size} height={height} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── TAIL (fluffy) ── */}
      <path d="M82 166 Q122 144 118 110 Q114 90 98 96 Q88 100 87 118"
        stroke="#181414" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M83 166 Q120 146 116 113 Q112 94 98 99"
        stroke="#282020" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* tail tip lighter */}
      <circle cx="87" cy="120" r="8" fill="#383030" />

      {/* ── BODY (cat costume) ── */}
      <ellipse cx="60" cy="150" rx="31" ry="34" fill="#181414" />
      {/* fluffy texture bumps on body */}
      <circle cx="36" cy="138" r="10" fill="#222020" />
      <circle cx="49" cy="129" r="9" fill="#222020" />
      <circle cx="60" cy="126" r="10" fill="#222020" />
      <circle cx="71" cy="129" r="9" fill="#222020" />
      <circle cx="84" cy="138" r="10" fill="#222020" />
      <circle cx="33" cy="152" r="9" fill="#1e1c1c" />
      <circle cx="87" cy="152" r="9" fill="#1e1c1c" />
      <circle cx="34" cy="165" r="8" fill="#1c1818" />
      <circle cx="86" cy="165" r="8" fill="#1c1818" />

      {/* ── LEGS ── */}
      <ellipse cx="46" cy="178" rx="15" ry="10" fill="#181414" />
      <ellipse cx="74" cy="178" rx="15" ry="10" fill="#181414" />
      {/* bare feet peeking */}
      <ellipse cx="46" cy="182" rx="12" ry="6.5" fill="#fcdcc8" />
      <ellipse cx="74" cy="182" rx="12" ry="6.5" fill="#fcdcc8" />

      {/* ── LEFT ARM ── */}
      <ellipse cx="22" cy="144" rx="11" ry="18" fill="#181414" transform="rotate(-14 22 144)" />
      <circle cx="17" cy="160" r="9" fill="#181414" />
      <circle cx="15" cy="158" r="7" fill="#222020" />
      {/* ── RIGHT ARM ── */}
      <ellipse cx="98" cy="144" rx="11" ry="18" fill="#181414" transform="rotate(14 98 144)" />
      <circle cx="103" cy="160" r="9" fill="#181414" />
      <circle cx="105" cy="158" r="7" fill="#222020" />

      {/* ── PINK BOW on costume ── */}
      <path d="M51,146 L60,152 L69,146 L60,152 Z" fill="#ff88bb" />
      <path d="M51,158 L60,152 L69,158 L60,152 Z" fill="#ff88bb" />
      <circle cx="60" cy="152" r="5" fill="#ff66a8" />
      <circle cx="60" cy="152" r="2.8" fill="#ffaad0" />

      {/* ── HOOD outer shape (dark fluffy) ── */}
      <circle cx="60" cy="72" r="44" fill="#181414" />

      {/* Hood fluffy bumps around perimeter */}
      <circle cx="22" cy="57" r="12" fill="#222020" />
      <circle cx="17" cy="72" r="11" fill="#222020" />
      <circle cx="22" cy="87" r="11" fill="#222020" />
      <circle cx="98" cy="57" r="12" fill="#222020" />
      <circle cx="103" cy="72" r="11" fill="#222020" />
      <circle cx="98" cy="87" r="11" fill="#222020" />
      <circle cx="30" cy="36" r="11" fill="#222020" />
      <circle cx="46" cy="26" r="11" fill="#222020" />
      <circle cx="60" cy="22" r="12" fill="#222020" />
      <circle cx="74" cy="26" r="11" fill="#222020" />
      <circle cx="90" cy="36" r="11" fill="#222020" />

      {/* ── CAT EARS (hidden when hat equipped) ── */}
      {!hat && (
        <g>
          {/* Left ear */}
          <path d="M24,46 L12,10 L48,28 Z" fill="#181414" />
          <path d="M26,44 L16,14 L46,29 Z" fill="#ffaac8" opacity="0.72" />
          {/* Right ear */}
          <path d="M96,46 L108,10 L72,28 Z" fill="#181414" />
          <path d="M94,44 L104,14 L74,29 Z" fill="#ffaac8" opacity="0.72" />
        </g>
      )}

      {/* ── FACE (skin) ── */}
      <circle cx="60" cy="78" r="31" fill="#fce6d2" />

      {/* ── HAIR FRINGE over forehead ── */}
      <ellipse cx="38" cy="61" rx="15" ry="11" fill="#181414" transform="rotate(-22 38 61)" />
      <ellipse cx="50" cy="54" rx="14" ry="10" fill="#181414" transform="rotate(-10 50 54)" />
      <ellipse cx="63" cy="51" rx="14" ry="10" fill="#181414" />
      <ellipse cx="76" cy="55" rx="13" ry="10" fill="#181414" transform="rotate(12 76 55)" />
      <ellipse cx="87" cy="63" rx="12" ry="9" fill="#181414" transform="rotate(22 87 63)" />

      {/* ── EYES (large anime) ── */}
      {/* Sclera */}
      <ellipse cx="44" cy="76" rx="13" ry="14" fill="white" />
      <ellipse cx="76" cy="76" rx="13" ry="14" fill="white" />

      {/* Iris - warm dark brown */}
      <circle cx="44" cy="77" r="11" fill="#3a2010" />
      <circle cx="76" cy="77" r="11" fill="#3a2010" />
      <circle cx="44" cy="77" r="10" fill="#4e2c14" />
      <circle cx="76" cy="77" r="10" fill="#4e2c14" />

      {/* Pupil */}
      <circle cx="44" cy="78" r="7" fill="#0c0808" />
      <circle cx="76" cy="78" r="7" fill="#0c0808" />

      {/* Large highlight */}
      <circle cx="48" cy="70" r="4.5" fill="white" />
      <circle cx="80" cy="70" r="4.5" fill="white" />
      {/* Small sparkle */}
      <circle cx="53" cy="77" r="2.2" fill="white" opacity="0.9" />
      <circle cx="85" cy="77" r="2.2" fill="white" opacity="0.9" />
      {/* Tiny sparkle */}
      <circle cx="40" cy="72" r="1.3" fill="white" opacity="0.65" />
      <circle cx="72" cy="72" r="1.3" fill="white" opacity="0.65" />

      {/* Eye outlines (soft top lid curve) */}
      <path d="M31,74 Q44,64 57,74" fill="none" stroke="#1a0c04" strokeWidth="2" strokeLinecap="round" />
      <path d="M63,74 Q76,64 89,74" fill="none" stroke="#1a0c04" strokeWidth="2" strokeLinecap="round" />

      {/* Eyelashes */}
      <path d="M30,70 Q36,63 43,66" stroke="#1a0c04" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M33,65 Q39,58 45,63" stroke="#1a0c04" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M39,62 Q44,57 50,61" stroke="#1a0c04" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M47,60 Q52,57 56,61" stroke="#1a0c04" strokeWidth="1.1" fill="none" strokeLinecap="round" />

      <path d="M62,74 Q70,65 77,68" stroke="#1a0c04" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M67,65 Q73,58 79,63" stroke="#1a0c04" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M73,62 Q78,57 84,61" stroke="#1a0c04" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M81,60 Q86,57 89,61" stroke="#1a0c04" strokeWidth="1.1" fill="none" strokeLinecap="round" />

      {/* Lower lash line */}
      <path d="M31,84 Q38,89 57,86" fill="none" stroke="#3a2010" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      <path d="M63,86 Q82,89 89,84" fill="none" stroke="#3a2010" strokeWidth="1" strokeLinecap="round" opacity="0.45" />

      {/* ── BLUSH (strong!) ── */}
      <ellipse cx="25" cy="86" rx="14" ry="9" fill="#ffb3c1" opacity="0.62" />
      <ellipse cx="95" cy="86" rx="14" ry="9" fill="#ffb3c1" opacity="0.62" />

      {/* ── NOSE ── */}
      <ellipse cx="60" cy="90" rx="3.5" ry="2.6" fill="#ff9ab8" />
      <ellipse cx="60" cy="89" rx="2" ry="1.3" fill="#ffd0e0" opacity="0.7" />

      {/* ── MOUTH (slightly open) ── */}
      <path d="M52,96 Q56,101 60,97 Q64,101 68,96" stroke="#e87090" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="60" cy="98" rx="4.5" ry="2.8" fill="#ffaac0" opacity="0.3" />

      {/* ══ HAT LAYER ══ */}
      {hat === 'hat_crown' && (
        <g>
          <rect x="37" y="20" width="46" height="14" rx="2" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1.2" />
          <polygon points="37,20 46,4 55,20" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1.2" />
          <polygon points="53,20 60,2 67,20" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1.2" />
          <polygon points="65,20 74,4 83,20" fill="#fcf6bd" stroke="#e8c800" strokeWidth="1.2" />
          <circle cx="60" cy="11" r="3.5" fill="#ff99c8" />
          <circle cx="47" cy="13" r="2.5" fill="#a9def9" />
          <circle cx="73" cy="13" r="2.5" fill="#d0f4de" />
        </g>
      )}
      {hat === 'hat_witch' && (
        <g>
          <polygon points="60,1 38,36 82,36" fill="#2a1a2a" />
          <ellipse cx="60" cy="36" rx="27" ry="7" fill="#2a1a2a" />
          <rect x="35" y="31" width="50" height="6" rx="2" fill="#e4c1f9" />
          <text x="54" y="24" fontSize="11" fill="#fcf6bd">★</text>
        </g>
      )}
      {hat === 'hat_strawberry' && (
        <g>
          <ellipse cx="60" cy="22" rx="19" ry="17" fill="#ff6b6b" />
          <ellipse cx="53" cy="19" rx="1.8" ry="2.2" fill="#fcf6bd" transform="rotate(-10 53 19)" />
          <ellipse cx="62" cy="15" rx="1.8" ry="2.2" fill="#fcf6bd" />
          <ellipse cx="68" cy="22" rx="1.8" ry="2.2" fill="#fcf6bd" transform="rotate(10 68 22)" />
          <ellipse cx="54" cy="27" rx="1.8" ry="2.2" fill="#fcf6bd" transform="rotate(-5 54 27)" />
          <path d="M54,8 Q60,2 66,8" fill="#d0f4de" />
          <path d="M51,10 Q54,2 57,8" fill="#d0f4de" />
          <path d="M63,8 Q66,2 69,10" fill="#d0f4de" />
        </g>
      )}
      {hat === 'hat_graduate' && (
        <g>
          <polygon points="60,4 34,22 86,22" fill="#1a1a2a" />
          <rect x="44" y="22" width="32" height="9" rx="1.5" fill="#1a1a2a" />
          <line x1="82" y1="22" x2="88" y2="34" stroke="#fcf6bd" strokeWidth="1.8" />
          <circle cx="88" cy="36" r="2.5" fill="#fcf6bd" />
        </g>
      )}
      {hat === 'hat_santa' && (
        <g>
          <path d="M34,36 Q43,6 60,0 Q76,6 86,36 Z" fill="#e83030" />
          <ellipse cx="60" cy="36" rx="28" ry="8" fill="white" />
          <circle cx="63" cy="2" r="7" fill="white" />
        </g>
      )}
      {hat === 'hat_party' && (
        <g>
          <polygon points="60,1 38,38 82,38" fill="#ff99c8" />
          <line x1="49" y1="10" x2="71" y2="36" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <line x1="57" y1="2" x2="78" y2="36" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <circle cx="38" cy="38" r="3.5" fill="#fcf6bd" />
          <circle cx="60" cy="38" r="3.5" fill="#e4c1f9" />
          <circle cx="82" cy="38" r="3.5" fill="#a9def9" />
          <circle cx="60" cy="1" r="4.5" fill="#fcf6bd" />
        </g>
      )}
      {hat === 'hat_flower' && (
        <g>
          <path d="M30,36 Q45,28 60,26 Q75,28 90,36" stroke="#d0f4de" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="38" cy="34" r="9" fill="#ff99c8" />
          <circle cx="51" cy="26" r="9" fill="#fcf6bd" />
          <circle cx="69" cy="26" r="9" fill="#e4c1f9" />
          <circle cx="82" cy="34" r="9" fill="#a9def9" />
          <circle cx="38" cy="34" r="4" fill="#fcf6bd" />
          <circle cx="51" cy="26" r="4" fill="#ff99c8" />
          <circle cx="69" cy="26" r="4" fill="#fcf6bd" />
          <circle cx="82" cy="34" r="4" fill="#ff99c8" />
        </g>
      )}
      {hat === 'hat_bunny' && (
        <g>
          <ellipse cx="40" cy="12" rx="10" ry="25" fill="#f0f0f0" />
          <ellipse cx="80" cy="12" rx="10" ry="25" fill="#f0f0f0" />
          <ellipse cx="40" cy="12" rx="5.5" ry="17" fill="#ff99c8" opacity="0.75" />
          <ellipse cx="80" cy="12" rx="5.5" ry="17" fill="#ff99c8" opacity="0.75" />
        </g>
      )}
      {hat === 'hat_beret' && (
        <g>
          <ellipse cx="60" cy="34" rx="32" ry="11" fill="#a9def9" />
          <ellipse cx="67" cy="25" rx="26" ry="19" fill="#a9def9" />
          <circle cx="78" cy="18" r="5" fill="#7bbfe8" />
        </g>
      )}
      {hat === 'hat_angel' && (
        <g>
          <ellipse cx="60" cy="18" rx="27" ry="8" fill="#fcf6bd" opacity="0.5" />
          <ellipse cx="60" cy="18" rx="27" ry="8" fill="none" stroke="#e8c800" strokeWidth="4.5" />
          <ellipse cx="60" cy="18" rx="27" ry="8" fill="none" stroke="white" strokeWidth="1.8" opacity="0.7" />
        </g>
      )}
      {hat === 'hat_devil' && (
        <g>
          <path d="M34,38 L22,8 L52,28 Z" fill="#e83030" />
          <path d="M86,38 L98,8 L68,28 Z" fill="#e83030" />
          <ellipse cx="28" cy="11" rx="5.5" ry="3.5" fill="#c01818" transform="rotate(-20 28 11)" />
          <ellipse cx="92" cy="11" rx="5.5" ry="3.5" fill="#c01818" transform="rotate(20 92 11)" />
        </g>
      )}
      {hat === 'hat_chef' && (
        <g>
          <rect x="40" y="30" width="40" height="11" rx="3.5" fill="#f0f0f0" stroke="#ddd" strokeWidth="1" />
          <ellipse cx="60" cy="28" rx="24" ry="20" fill="#f0f0f0" stroke="#ddd" strokeWidth="1" />
          <ellipse cx="60" cy="13" rx="14" ry="11" fill="#f5f5f5" />
        </g>
      )}
      {hat === 'hat_pirate' && (
        <g>
          <path d="M30,40 Q60,14 90,40 L86,46 Q60,24 34,46 Z" fill="#2a1a2a" />
          <path d="M36,44 Q60,30 84,44" stroke="#e8e0e6" strokeWidth="2.5" fill="none" />
          <circle cx="60" cy="28" r="7.5" fill="white" />
          <circle cx="57" cy="26" r="2" fill="#2a1a2a" />
          <circle cx="63" cy="26" r="2" fill="#2a1a2a" />
          <line x1="57" y1="31" x2="59.5" y2="31" stroke="#2a1a2a" strokeWidth="1.8" />
          <line x1="60.5" y1="31" x2="63" y2="31" stroke="#2a1a2a" strokeWidth="1.8" />
        </g>
      )}
      {hat === 'hat_headphones' && (
        <g>
          <path d="M18,72 Q18,26 60,26 Q102,26 102,72" stroke="#3a3038" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <rect x="10" y="64" width="15" height="20" rx="7.5" fill="#3a3038" />
          <rect x="95" y="64" width="15" height="20" rx="7.5" fill="#3a3038" />
          <rect x="12" y="66" width="11" height="16" rx="5.5" fill="#a9def9" />
          <rect x="97" y="66" width="11" height="16" rx="5.5" fill="#a9def9" />
        </g>
      )}
      {hat === 'hat_mushroom' && (
        <g>
          <rect x="52" y="30" width="16" height="11" rx="3.5" fill="#f5deb3" />
          <ellipse cx="60" cy="30" rx="32" ry="21" fill="#e83030" />
          <ellipse cx="47" cy="22" rx="6.5" ry="5" fill="white" opacity="0.7" />
          <ellipse cx="63" cy="16" rx="7.5" ry="5.5" fill="white" opacity="0.7" />
          <ellipse cx="76" cy="24" rx="5.5" ry="4" fill="white" opacity="0.7" />
        </g>
      )}

      {/* ══ ACCESSORY LAYER ══ */}
      {accessory === 'acc_ribbon' && (
        <g>
          <path d="M46,115 Q60,122 74,115" stroke="#ff99c8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="116" r="4.5" fill="#ff99c8" />
          <path d="M56,114 L51,107 L60,116 L51,114 Z" fill="#ff99c8" />
          <path d="M64,114 L69,107 L60,116 L69,114 Z" fill="#ff99c8" />
        </g>
      )}
      {accessory === 'acc_glasses' && (
        <g>
          <circle cx="44" cy="76" r="12" stroke="#a9def9" strokeWidth="2.2" fill="none" />
          <circle cx="76" cy="76" r="12" stroke="#a9def9" strokeWidth="2.2" fill="none" />
          <line x1="56" y1="76" x2="64" y2="76" stroke="#a9def9" strokeWidth="2.2" />
          <line x1="18" y1="74" x2="32" y2="75" stroke="#a9def9" strokeWidth="1.8" />
          <line x1="88" y1="75" x2="102" y2="74" stroke="#a9def9" strokeWidth="1.8" />
        </g>
      )}
      {accessory === 'acc_bowtie' && (
        <g>
          <path d="M50,115 L60,121 L70,115 L60,121 Z" fill="#a9def9" />
          <path d="M50,127 L60,121 L70,127 L60,121 Z" fill="#a9def9" />
          <circle cx="60" cy="121" r="4" fill="#7bbfe8" />
        </g>
      )}
      {accessory === 'acc_necklace' && (
        <g>
          <path d="M38,114 Q60,124 82,114" stroke="#e8c800" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="124" r="5" fill="#e83030" />
          <path d="M58,122 C58,120 60,119 60,121 C60,119 62,120 62,122 L60,125 Z" fill="#ff4444" />
        </g>
      )}
      {accessory === 'acc_star' && (
        <g>
          <path d="M38,114 Q60,124 82,114" stroke="#a9def9" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <polygon points="60,118 61.8,124 67,124 63,127 64.8,133 60,130 55.2,133 57,127 53,124 58.2,124" fill="#fcf6bd" stroke="#e8c800" strokeWidth="0.5" />
        </g>
      )}
      {accessory === 'acc_scarf' && (
        <g>
          <path d="M30,111 Q60,121 90,111" stroke="#ff99c8" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M60,116 L56,134 L60,131 L64,136" stroke="#ff6aa8" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {accessory === 'acc_mustache' && (
        <g>
          <path d="M43,93 C47,90 52,96 60,93 C68,96 73,90 77,93" stroke="#3a2010" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
      {accessory === 'acc_clover' && (
        <g>
          <path d="M38,114 Q60,124 82,114" stroke="#d0f4de" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="121" r="5" fill="#4caf50" />
          <circle cx="55" cy="116.5" r="5" fill="#4caf50" />
          <circle cx="65" cy="116.5" r="5" fill="#4caf50" />
          <circle cx="60" cy="112" r="5" fill="#4caf50" />
          <line x1="60" y1="126" x2="60" y2="132" stroke="#4caf50" strokeWidth="2.5" />
        </g>
      )}
      {accessory === 'acc_heart_eyes' && (
        <g>
          <path d="M32,76 C32,73 34,71.5 36,72.5 C38,71.5 40,73 40,76 C40,78.5 36,82 36,82 C36,82 32,78.5 32,76 Z" fill="#e83030" />
          <path d="M80,76 C80,73 82,71.5 84,72.5 C86,71.5 88,73 88,76 C88,78.5 84,82 84,82 C84,82 80,78.5 80,76 Z" fill="#e83030" />
          <line x1="40" y1="76" x2="80" y2="76" stroke="#ff99c8" strokeWidth="2.5" />
          <line x1="16" y1="74" x2="32" y2="75.5" stroke="#ff99c8" strokeWidth="1.8" />
          <line x1="88" y1="75.5" x2="104" y2="74" stroke="#ff99c8" strokeWidth="1.8" />
        </g>
      )}
      {accessory === 'acc_collar' && (
        <g>
          <path d="M31,112 Q60,122 89,112" stroke="#e8c800" strokeWidth="5" fill="none" strokeLinecap="round" />
          <ellipse cx="60" cy="121" rx="6.5" ry="7.5" fill="#e8c800" />
          <ellipse cx="60" cy="124.5" rx="4.5" ry="4" fill="#c8a800" />
          <circle cx="60" cy="125.5" r="1.8" fill="#3a2800" />
        </g>
      )}
      {accessory === 'acc_pearl' && (
        <g>
          <circle cx="36" cy="114" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
          <circle cx="43" cy="118" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
          <circle cx="51" cy="121" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
          <circle cx="60" cy="122" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
          <circle cx="69" cy="121" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
          <circle cx="77" cy="118" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
          <circle cx="84" cy="114" r="3.5" fill="white" stroke="#ddd" strokeWidth="1" />
        </g>
      )}
      {accessory === 'acc_sunglasses' && (
        <g>
          <rect x="30" y="70" width="26" height="14" rx="7" fill="#1a1a1a" opacity="0.88" />
          <rect x="64" y="70" width="26" height="14" rx="7" fill="#1a1a1a" opacity="0.88" />
          <line x1="56" y1="76" x2="64" y2="76" stroke="#1a1a1a" strokeWidth="2.5" />
          <line x1="16" y1="73" x2="30" y2="74" stroke="#1a1a1a" strokeWidth="1.8" />
          <line x1="90" y1="74" x2="104" y2="73" stroke="#1a1a1a" strokeWidth="1.8" />
          <rect x="30" y="70" width="26" height="5" rx="5" fill="white" opacity="0.12" />
          <rect x="64" y="70" width="26" height="5" rx="5" fill="white" opacity="0.12" />
        </g>
      )}
      {accessory === 'acc_mask' && (
        <g>
          <rect x="32" y="85" width="56" height="26" rx="11" fill="white" stroke="#e0e0e0" strokeWidth="1.5" />
          <line x1="38" y1="92" x2="82" y2="92" stroke="#e8e8e8" strokeWidth="1.5" />
          <line x1="38" y1="98" x2="82" y2="98" stroke="#e8e8e8" strokeWidth="1.5" />
          <line x1="38" y1="104" x2="82" y2="104" stroke="#e8e8e8" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  )
}

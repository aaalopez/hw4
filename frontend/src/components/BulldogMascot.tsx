// Problem 10 brand-identity mascot: an actual sitting dog — not a
// standing humanoid figure — wearing a Yale bandana tied around its neck,
// with the same chibi-sticker face as the chat launcher (ChatBulldog.tsx):
// big round white head, floppy brown patch ears, a brown eye patch, one
// eye winking. No arms, hands, trousers, or boots — just a stout dog body
// (wide sitting torso, a brown saddle patch, two front paws) so the two
// mascots read as the same character. Flat, outlined fills (no
// gradients/filters), matching the chat bulldog's sticker look. Drawn as
// hand-built SVG (no external image asset/service involved) so it's
// lightweight, crisp at any size, and themeable via CSS variables.
const OUTLINE = '#4a3524'
const PATCH = '#c47f3e'

export default function BulldogMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 260"
      className={className}
      role="img"
      aria-label="Campus Customs bulldog mascot sitting with a Yale bandana tied around its neck"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ground shadow */}
      <ellipse cx="120" cy="224" rx="74" ry="9" fill="#000" opacity="0.14" />

      {/* sitting dog body — wide and compact for a stouter build */}
      <path
        d="M54 142 Q120 114 186 142 Q200 180 164 216 L76 216 Q40 180 54 142 Z"
        fill="var(--white)"
        stroke={OUTLINE}
        strokeWidth="3.5"
      />
      {/* bandana, tied around the neck — the band wrapping the neck,
          a knot on one side, and a triangle flap hanging down the chest */}
      <path d="M72 142 Q120 128 168 142 L168 156 Q120 142 72 156 Z" fill="var(--yale-blue)" stroke={OUTLINE} strokeWidth="3" />
      <circle cx="166" cy="149" r="9" fill="var(--yale-blue-dark)" stroke={OUTLINE} strokeWidth="2.5" />
      <path d="M94 150 L146 150 L120 202 Z" fill="var(--yale-blue)" stroke={OUTLINE} strokeWidth="3" strokeLinejoin="round" />
      {/* YALE across the flap */}
      <text
        x="120"
        y="174"
        textAnchor="middle"
        fontFamily="Oswald, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="1"
        fill="var(--yale-gold)"
      >
        YALE
      </text>

      {/* front paws — one painted brown, echoing the ear/eye patch color
          instead of a separate body spot */}
      <ellipse cx="84" cy="210" rx="16" ry="12" fill="var(--white)" stroke={OUTLINE} strokeWidth="3" />
      <ellipse cx="156" cy="210" rx="16" ry="12" fill={PATCH} stroke={OUTLINE} strokeWidth="3" />

      {/* head — same chibi-sticker face as the chat launcher, sitting
          directly on the shoulders */}
      <path d="M64 40 Q42 52 50 80 Q68 86 82 62 Z" fill={PATCH} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M176 40 Q198 52 190 80 Q172 86 158 62 Z" fill={PATCH} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />

      <circle cx="120" cy="80" r="60" fill="var(--white)" stroke={OUTLINE} strokeWidth="3.5" />

      <path d="M142 28 Q178 32 172 68 Q160 82 140 70 Q128 50 142 28 Z" fill={PATCH} stroke={OUTLINE} strokeWidth="3.5" strokeLinejoin="round" />

      {/* open eye */}
      <circle cx="94" cy="78" r="7.5" fill="#2a2320" />
      <circle cx="96.5" cy="75" r="2.2" fill="var(--white)" />

      {/* winking eye */}
      <path d="M136 76 Q146 68 156 76" stroke={OUTLINE} strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* nose */}
      <ellipse cx="120" cy="100" rx="9" ry="6" fill="#2a2320" />
      <line x1="120" y1="106" x2="120" y2="112" stroke="#2a2320" strokeWidth="2.5" strokeLinecap="round" />

      {/* simple content smile */}
      <path d="M108 113 Q120 120 132 113" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

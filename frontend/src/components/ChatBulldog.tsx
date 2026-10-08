// Chibi-style English bulldog puppy for the chat toggle button — matched
// closely to a reference sticker illustration: a small sitting puppy with
// an oversized round white head, two floppy brown ears, a brown patch over
// one eye/ear, and a single wink for personality. Kept deliberately simple
// (no rosy clown cheeks, no exaggerated grin) so it reads as cute rather
// than cartoonish. Distinct from BulldogMascot.tsx's full-body model shot.
const OUTLINE = '#4a3524'
const PATCH = '#c47f3e'

export default function ChatBulldog({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Cartoon English bulldog puppy sitting and winking"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* small sitting body */}
      <path
        d="M56 158 Q100 136 144 158 Q152 186 132 198 L68 198 Q48 186 56 158 Z"
        fill="var(--white)"
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* saddle patch on the body, echoing the ear/eye patch */}
      <path d="M118 150 Q146 154 142 182 Q126 190 112 172 Z" fill={PATCH} stroke={OUTLINE} strokeWidth="3" />
      {/* little front paws */}
      <ellipse cx="82" cy="192" rx="12" ry="9" fill="var(--white)" stroke={OUTLINE} strokeWidth="3" />
      <ellipse cx="118" cy="192" rx="12" ry="9" fill="var(--white)" stroke={OUTLINE} strokeWidth="3" />

      {/* floppy ears, behind the head */}
      <path
        d="M44 60 Q22 72 30 100 Q48 106 62 82 Z"
        fill={PATCH}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M156 60 Q178 72 170 100 Q152 106 138 82 Z"
        fill={PATCH}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* big round white head */}
      <circle cx="100" cy="100" r="60" fill="var(--white)" stroke={OUTLINE} strokeWidth="3.5" />

      {/* soft patch over one eye, like the reference */}
      <path
        d="M122 48 Q158 52 152 88 Q140 102 120 90 Q108 70 122 48 Z"
        fill={PATCH}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* open eye */}
      <circle cx="74" cy="98" r="7.5" fill="#2a2320" />
      <circle cx="76.5" cy="95" r="2.2" fill="var(--white)" />

      {/* winking eye — a simple happy closed curve */}
      <path d="M116 96 Q126 88 136 96" stroke={OUTLINE} strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* small nose */}
      <ellipse cx="100" cy="120" rx="9" ry="6" fill="#2a2320" />
      <line x1="100" y1="126" x2="100" y2="132" stroke="#2a2320" strokeWidth="2.5" strokeLinecap="round" />

      {/* small, closed, content smile */}
      <path d="M88 133 Q100 140 112 133" stroke={OUTLINE} strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

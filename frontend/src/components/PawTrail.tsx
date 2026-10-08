import { useEffect, useRef, useState } from 'react'
import './PawTrail.css'

interface Print {
  id: number
  x: number
  y: number
  rotation: number
}

// A playful brand touch: the cursor leaves a fading trail of paw prints as
// it moves, alternating left/right of the travel line like footsteps.
// Distance-gated (not a print per mousemove event) so it stays light at
// any mouse speed, and skipped entirely for prefers-reduced-motion.
const MIN_DISTANCE = 34 // px the cursor must travel before the next print
const MAX_PRINTS = 24 // cap on simultaneously-visible prints
const LIFETIME_MS = 900 // must match the fade animation duration in PawTrail.css
const STEP_OFFSET = 7 // how far each print sits to the side of the travel line

export default function PawTrail() {
  const [prints, setPrints] = useState<Print[]>([])
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const nextId = useRef(0)
  const stepSide = useRef(1)
  const timeouts = useRef<number[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    function handleMove(e: MouseEvent) {
      const { clientX: x, clientY: y } = e
      const last = lastPos.current
      if (last) {
        const dx = x - last.x
        const dy = y - last.y
        const dist = Math.hypot(dx, dy)
        if (dist < MIN_DISTANCE) return

        const angle = Math.atan2(dy, dx)
        const perpX = -Math.sin(angle)
        const perpY = Math.cos(angle)
        stepSide.current *= -1

        const id = nextId.current++
        const print: Print = {
          id,
          x: x + perpX * STEP_OFFSET * stepSide.current,
          y: y + perpY * STEP_OFFSET * stepSide.current,
          rotation: (angle * 180) / Math.PI + 90,
        }

        setPrints((prev) => {
          const next = [...prev, print]
          return next.length > MAX_PRINTS ? next.slice(next.length - MAX_PRINTS) : next
        })

        const timeoutId = window.setTimeout(() => {
          setPrints((prev) => prev.filter((p) => p.id !== id))
        }, LIFETIME_MS)
        timeouts.current.push(timeoutId)
      }
      lastPos.current = { x, y }
    }

    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      timeouts.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return (
    <div className="paw-trail" aria-hidden="true">
      {prints.map((p) => (
        <div
          key={p.id}
          className="paw-trail__print"
          style={{ left: p.x, top: p.y, transform: `translate(-50%, -50%) rotate(${p.rotation}deg)` }}
        >
          <svg viewBox="0 0 36 36" width="16" height="16">
            <circle cx="18" cy="24" r="8" fill="var(--yale-blue)" />
            <circle cx="8" cy="12" r="4" fill="var(--yale-blue)" />
            <circle cx="16" cy="6" r="4" fill="var(--yale-blue)" />
            <circle cx="24" cy="6" r="4" fill="var(--yale-blue)" />
            <circle cx="30" cy="12" r="4" fill="var(--yale-blue)" />
          </svg>
        </div>
      ))}
    </div>
  )
}

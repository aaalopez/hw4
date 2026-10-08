// Problem 10: "add a picture of Yale campus" on the home page. Rather than
// fetching an external photo (risk of broken/mismatched licensing, and this
// app shouldn't depend on a third-party image URL at runtime), this is a
// flat-vector illustration of Yale's iconic Collegiate Gothic skyline —
// a tower modeled loosely on Harkness Tower, flanked by gabled rooflines —
// crisp at any size and themeable with the site's own brand colors.
export default function CampusSkyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 260"
      className={className}
      role="img"
      aria-label="Illustrated skyline of Yale's Collegiate Gothic campus"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax slice"
    >
      <rect x="0" y="200" width="900" height="60" fill="var(--yale-blue-dark)" />

      {/* low surrounding buildings */}
      <rect x="20" y="150" width="90" height="100" fill="var(--yale-blue)" />
      <rect x="120" y="170" width="70" height="80" fill="var(--yale-blue-dark)" />
      <rect x="690" y="165" width="80" height="85" fill="var(--yale-blue-dark)" />
      <rect x="780" y="145" width="100" height="105" fill="var(--yale-blue)" />

      {/* gabled hall, left of tower */}
      <rect x="260" y="120" width="120" height="130" fill="var(--yale-blue)" />
      <polygon points="260,120 320,80 380,120" fill="var(--yale-blue-dark)" />
      <rect x="300" y="160" width="20" height="36" fill="var(--yale-blue-light)" />

      {/* gabled hall, right of tower */}
      <rect x="520" y="130" width="120" height="120" fill="var(--yale-blue)" />
      <polygon points="520,130 580,92 640,130" fill="var(--yale-blue-dark)" />
      <rect x="560" y="166" width="20" height="36" fill="var(--yale-blue-light)" />

      {/* central Harkness-style tower */}
      <rect x="400" y="40" width="100" height="210" fill="var(--yale-blue-dark)" />
      <rect x="390" y="20" width="120" height="26" fill="var(--yale-blue-dark)" />
      {/* pointed-arch windows */}
      {[70, 110, 150].map((y) => (
        <path
          key={y}
          d={`M418 ${y + 24} V ${y} Q 450 ${y - 14} 482 ${y} V ${y + 24} Z`}
          fill="var(--yale-blue-light)"
          opacity="0.85"
        />
      ))}
      {/* crenellations */}
      {[400, 420, 440, 460, 480].map((x) => (
        <rect key={x} x={x} y="8" width="14" height="16" fill="var(--yale-blue-dark)" />
      ))}
      {/* spire flag */}
      <line x1="450" y1="20" x2="450" y2="2" stroke="var(--yale-gold)" strokeWidth="3" />
      <polygon points="450,2 468,8 450,14" fill="var(--yale-gold)" />
    </svg>
  )
}

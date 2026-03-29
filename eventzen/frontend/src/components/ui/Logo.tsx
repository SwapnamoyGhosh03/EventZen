interface LogoProps {
  /** Size of the mark in pixels */
  size?: number;
  /** Show the "EventZen" wordmark beside the mark */
  showText?: boolean;
  /** Invert colors for dark backgrounds */
  dark?: boolean;
  className?: string;
}

/** The golden trefoil mark — 3 interlocking arcs */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
    >
      {/*
        Three thick arcs (r=33.5, stroke-width=15), each spanning 200°, arranged 120° apart.
        Arc 1: top   (170° → 10°  CW through 270°)
        Arc 2: lower-right (290° → 130° CW through  30°)
        Arc 3: lower-left  ( 50° → 250° CW through 150°)
        Gaps between consecutive arc tips appear at ~30°, ~150°, ~270° — matching the logo.
      */}
      <g stroke="#D4A843" strokeWidth="15" strokeLinecap="round">
        {/* Arc 1 — top */}
        <path d="M 17 56 A 33.5 33.5 0 1 1 83 56" />
        {/* Arc 2 — lower-right */}
        <path d="M 62 19 A 33.5 33.5 0 1 1 29 76" />
        {/* Arc 3 — lower-left (drawn last → appears on top in overlaps, creating pinwheel depth) */}
        <path d="M 72 76 A 33.5 33.5 0 1 1 39 19" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 32, showText = true, dark = false, className = "" }: LogoProps) {
  const textColor = dark ? "text-white" : "text-near-black";
  const fontSize = Math.round(size * 0.56);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span
          className={`font-heading font-bold leading-none ${textColor}`}
          style={{ fontSize }}
        >
          EventZen
        </span>
      )}
    </span>
  );
}

/** Just the mark — useful for collapsed sidebar, favicon area */
export { LogoMark };

interface MarqueeStripProps {
  text: string;
  speed?: "normal" | "slow";
  variant?: "dark" | "light";
  className?: string;
}

export default function MarqueeStrip({
  text,
  speed = "normal",
  variant = "dark",
  className = "",
}: MarqueeStripProps) {
  const bgClasses = variant === "dark"
    ? "bg-near-black text-cream"
    : "bg-cream text-near-black";

  const animClass = speed === "slow" ? "animate-marquee-slow" : "animate-marquee";

  // Repeat text enough times for seamless loop
  const items = Array(4).fill(text);

  return (
    <div
      className={`
        overflow-hidden py-3
        font-accent text-[13px] tracking-[2px] uppercase
        ${bgClasses} ${className}
      `}
    >
      <div className={`flex gap-12 whitespace-nowrap ${animClass}`}>
        {items.map((t, i) => (
          <span key={i} className="flex-shrink-0">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

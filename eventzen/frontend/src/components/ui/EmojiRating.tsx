interface EmojiRatingProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const RATINGS = [
  { score: 1, emoji: "😞", label: "Poor",      ring: "ring-burgundy/40",    bg: "bg-burgundy/8",    text: "text-burgundy"    },
  { score: 2, emoji: "😕", label: "Fair",      ring: "ring-orange-400/50",  bg: "bg-orange-50",     text: "text-orange-500"  },
  { score: 3, emoji: "😐", label: "Average",   ring: "ring-amber/50",       bg: "bg-amber/10",      text: "text-amber"       },
  { score: 4, emoji: "😊", label: "Good",      ring: "ring-sage/50",        bg: "bg-sage/10",       text: "text-sage"        },
  { score: 5, emoji: "🤩", label: "Excellent", ring: "ring-green-400/60",   bg: "bg-green-50",      text: "text-green-600"   },
];

const SIZE = {
  sm: { emoji: "text-2xl", btn: "w-12 h-12", label: "text-[10px]" },
  md: { emoji: "text-3xl", btn: "w-14 h-14", label: "text-[11px]" },
  lg: { emoji: "text-4xl", btn: "w-16 h-16", label: "text-xs"     },
};

export default function EmojiRating({
  value,
  onChange,
  disabled = false,
  size = "md",
}: EmojiRatingProps) {
  const s = SIZE[size];
  const selected = RATINGS.find((r) => r.score === value);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-center gap-2">
        {RATINGS.map((r) => {
          const isActive = value === r.score;
          return (
            <button
              key={r.score}
              type="button"
              disabled={disabled}
              onClick={() => onChange(r.score)}
              className={`
                ${s.btn} rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-150 select-none
                ${isActive
                  ? `border-transparent ring-2 ${r.ring} ${r.bg} scale-110 shadow-md`
                  : "border-border-light hover:border-warm-tan hover:scale-105 hover:shadow-sm bg-white"}
                ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}
              `}
            >
              <span className={s.emoji}>{r.emoji}</span>
              <span className={`${s.label} font-accent font-semibold leading-none ${isActive ? r.text : "text-muted-gray"}`}>
                {r.score}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected label */}
      <div className="text-center min-h-[20px]">
        {selected ? (
          <span className={`font-body text-sm font-semibold ${selected.text}`}>
            {selected.emoji} {selected.label}
          </span>
        ) : (
          <span className="font-body text-sm text-muted-gray">Select a rating</span>
        )}
      </div>
    </div>
  );
}

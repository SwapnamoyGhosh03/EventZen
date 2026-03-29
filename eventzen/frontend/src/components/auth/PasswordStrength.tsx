import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  checks: { label: string; met: boolean }[];
}

function evaluateStrength(password: string): StrengthResult {
  const checks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "Uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Number (0-9)", met: /[0-9]/.test(password) },
    { label: "Special character (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const levels: Record<number, { label: string; color: string; bgColor: string }> = {
    0: { label: "Too weak", color: "bg-red-500", bgColor: "text-red-600" },
    1: { label: "Weak", color: "bg-red-500", bgColor: "text-red-600" },
    2: { label: "Fair", color: "bg-orange-500", bgColor: "text-orange-600" },
    3: { label: "Good", color: "bg-yellow-500", bgColor: "text-yellow-600" },
    4: { label: "Strong", color: "bg-emerald-500", bgColor: "text-emerald-600" },
    5: { label: "Very strong", color: "bg-emerald-600", bgColor: "text-emerald-700" },
  };

  const level = levels[score];
  return { score, ...level, checks };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => evaluateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-medium ${strength.bgColor} transition-colors`}>
        {strength.label}
      </p>

      {/* Checklist */}
      <ul className="space-y-1">
        {strength.checks.map((check) => (
          <li
            key={check.label}
            className={`flex items-center gap-2 text-xs transition-colors ${
              check.met ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <span className="text-[10px]">{check.met ? "\u2713" : "\u2717"}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

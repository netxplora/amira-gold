// Lightweight country flag using twemoji-style emoji rendering with consistent sizing.
// Falls back to a silver disc if the country code isn't recognized.

const FLAGS: Record<string, { emoji: string; name: string }> = {
  CH: { emoji: "🇨🇭", name: "Switzerland" },
  AE: { emoji: "🇦🇪", name: "United Arab Emirates" },
  SG: { emoji: "🇸🇬", name: "Singapore" },
  GB: { emoji: "🇬🇧", name: "United Kingdom" },
  US: { emoji: "🇺🇸", name: "United States" },
  DE: { emoji: "🇩🇪", name: "Germany" },
  HK: { emoji: "🇭🇰", name: "Hong Kong" },
  CA: { emoji: "🇨🇦", name: "Canada" },
  SA: { emoji: "🇸🇦", name: "Saudi Arabia" },
};

export function Flag({ code, className = "" }: { code: keyof typeof FLAGS | string; className?: string }) {
  const f = FLAGS[code as keyof typeof FLAGS];
  if (!f) {
    return (
      <span className={`inline-flex h-5 w-7 items-center justify-center rounded-sm bg-gradient-silver text-[10px] text-silver-foreground ${className}`}>
        {String(code).slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={f.name}
      className={`inline-flex h-5 w-7 items-center justify-center overflow-hidden rounded-sm bg-card text-base leading-none ring-1 ring-border/60 ${className}`}
      style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
    >
      {f.emoji}
    </span>
  );
}

export const VAULT_LOCATIONS = [
  { code: "CH", city: "Zurich", country: "Switzerland", desc: "LBMA-certified Swiss vault" },
  { code: "AE", city: "Dubai", country: "United Arab Emirates", desc: "DMCC-approved vault" },
  { code: "SG", city: "Singapore", country: "Singapore", desc: "Freeport precious metals vault" },
  { code: "GB", city: "London", country: "United Kingdom", desc: "Loomis insured custody" },
  { code: "CA", city: "Toronto", country: "Canada", desc: "Brink's Toronto secure facility" },
  { code: "SA", city: "Riyadh", country: "Saudi Arabia", desc: "Brink's Riyadh secure facility" },
] as const;

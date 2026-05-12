import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-mesh-luxury p-6 md:p-8">
      <div className="absolute inset-y-0 right-0 w-1/2 opacity-30 blur-3xl" aria-hidden>
        <div className="h-full w-full bg-gradient-gold" />
      </div>
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
              {icon}
            </div>
          )}
          <div>
            {eyebrow && (
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent = "gold",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "gold" | "silver" | "ruby" | "muted";
  icon?: ReactNode;
}) {
  const accentMap = {
    gold: "border-gold/30 shadow-gold",
    silver: "border-silver/40 shadow-silver",
    ruby: "border-ruby/40 shadow-ruby",
    muted: "border-border/60",
  } as const;
  const valueClass =
    accent === "gold"
      ? "text-gradient-gold"
      : accent === "silver"
        ? "text-gradient-silver"
        : accent === "ruby"
          ? "text-ruby"
          : "text-foreground";
  return (
    <div className={`rounded-2xl border bg-card/80 p-5 ${accentMap[accent]}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </div>
      <div className={`mt-2 text-2xl font-bold md:text-3xl ${valueClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

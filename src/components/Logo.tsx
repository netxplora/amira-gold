import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/amira-logo.png";

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  return (
    <Link to="/" className={`group flex items-center gap-2.5 ${className}`}>
      <img
        src={logoMark}
        alt="Amira Gold"
        width={88}
        height={88}
        loading="eager"
        decoding="async"
        className={`${dim} shrink-0 object-contain drop-shadow-[0_0_12px_color-mix(in_oklab,var(--gold)_35%,transparent)] transition-transform group-hover:scale-105`}
      />
      <span className={`${text} font-display font-semibold tracking-tight`}>
        Amira <span className="text-gradient-gold">Gold</span>
      </span>
    </Link>
  );
}

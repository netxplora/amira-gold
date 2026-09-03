import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function GoldPriceTicker({ compact = false }: { compact?: boolean }) {
  const { pricePerGram, change } = useGoldPrice();
  const up = change >= 0;
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 shadow-2xs backdrop-blur-md ${
        compact ? "text-xs" : "text-xs sm:text-sm"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-medium text-muted-foreground">XAU/USD Live</span>
      <span className="font-display font-bold text-foreground">{formatUSD(pricePerGram)}<span className="text-[11px] font-normal text-muted-foreground">/g</span></span>
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          up ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border border-destructive/20 bg-destructive/10 text-destructive"
        }`}
      >
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
}


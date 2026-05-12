import { useGoldPrice, formatUSD } from "@/lib/gold-price";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function GoldPriceTicker({ compact = false }: { compact?: boolean }) {
  const { pricePerGram, change } = useGoldPrice();
  const up = change >= 0;
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-gold/30 bg-card/70 px-4 py-2 backdrop-blur ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
      </span>
      <span className="text-muted-foreground">XAU/USD</span>
      <span className="font-semibold text-gradient-gold">{formatUSD(pricePerGram)}/g</span>
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
          up ? "bg-emerald-500/10 text-emerald-400" : "bg-ruby/15 text-ruby"
        }`}
      >
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
}

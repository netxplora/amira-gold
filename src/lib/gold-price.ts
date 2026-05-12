import { useEffect, useRef, useState } from "react";
import { getGoldPrice } from "@/utils/gold-price.functions";
import { supabase } from "@/integrations/supabase/client";

export function useGoldPrice(refreshMs = 30_000) {
  const [price, setPrice] = useState(80);
  const [change, setChange] = useState(0);
  const prevRef = useRef(80);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const { pricePerGram, change24h } = await getGoldPrice();
        if (!mounted) return;
        const pct = ((pricePerGram - prevRef.current) / prevRef.current) * 100;
        prevRef.current = pricePerGram;
        setPrice(pricePerGram);
        setChange(change24h || pct);
        // Fire any user-defined price alerts (server-side, RLS-scoped to current user)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.rpc("check_gold_price_alerts" as never, { _current_price: pricePerGram } as never);
          }
        } catch { /* non-fatal */ }
      } catch {
        // keep last value
      }
    };
    tick();
    const t = setInterval(tick, refreshMs);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [refreshMs]);

  return { pricePerGram: price, change };
}

export function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

import { createServerFn } from "@tanstack/react-start";

// Simple in-memory cache (per worker instance)
let cache: { price: number; change24h: number; ts: number } | null = null;
const TTL_MS = 60_000;

const TROY_OZ_TO_G = 31.1034768;

export const getGoldPrice = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return { pricePerGram: cache.price, change24h: cache.change24h, source: "cache" as const };
  }

  const apiKey = process.env.METALS_DEV_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const json = (await res.json()) as { metals?: { gold?: number }; rates?: { gold?: number } };
        const ozPrice = json?.metals?.gold ?? json?.rates?.gold;
        if (typeof ozPrice === "number" && ozPrice > 0) {
          const pricePerGram = ozPrice / TROY_OZ_TO_G;
          cache = { price: pricePerGram, change24h: 0, ts: now };
          return { pricePerGram, change24h: 0, source: "metals.dev" as const };
        }
      }
    } catch (e) {
      console.error("metals.dev fetch failed", e);
    }
  }

  // Fallback: stable pseudo-live price ~ $80/g with sinusoidal drift
  const t = now / 60000;
  const price = 80 + Math.sin(t / 7) * 1.5 + Math.cos(t / 3) * 0.5;
  cache = { price, change24h: Math.sin(t / 17) * 0.8, ts: now };
  return { pricePerGram: price, change24h: cache.change24h, source: "simulated" as const };
});

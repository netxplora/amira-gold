import { useEffect, useState } from "react";

export type JewelryPurity = "18k" | "22k" | "24k";
export type MakingChargeType = "fixed" | "percent";

export type JewelryProduct = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  weight_grams: number;
  purity: JewelryPurity;
  making_charge_type: MakingChargeType;
  making_charge_value: number;
  stock_quantity: number;
  thumbnail_url: string | null;
  gallery_urls: string[];
  active: boolean;
};

export type JewelryCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  active: boolean;
};

// Purity affects effective gold value: 24k = 100%, 22k = ~91.6%, 18k = 75%
const PURITY_FACTOR: Record<JewelryPurity, number> = {
  "24k": 1.0,
  "22k": 0.9167,
  "18k": 0.75,
};

export function calcJewelryPrice(p: Pick<JewelryProduct, "weight_grams" | "purity" | "making_charge_type" | "making_charge_value">, goldRatePerGram: number) {
  const factor = PURITY_FACTOR[p.purity] ?? 1;
  const goldValue = p.weight_grams * goldRatePerGram * factor;
  const making = p.making_charge_type === "fixed"
    ? Number(p.making_charge_value)
    : goldValue * (Number(p.making_charge_value) / 100);
  const total = goldValue + making;
  return {
    goldValue: Math.round(goldValue * 100) / 100,
    making: Math.round(making * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Cart (localStorage)
export type CartItem = { product_id: string; quantity: number };
const CART_KEY = "amira-jewelry-cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
}
function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("amira-cart-change"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => readCart());
  useEffect(() => {
    const h = () => setItems(readCart());
    window.addEventListener("amira-cart-change", h);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("amira-cart-change", h); window.removeEventListener("storage", h); };
  }, []);
  return {
    items,
    add(product_id: string, quantity = 1) {
      const cur = readCart();
      const i = cur.findIndex((x) => x.product_id === product_id);
      if (i >= 0) cur[i].quantity += quantity; else cur.push({ product_id, quantity });
      writeCart(cur);
    },
    setQty(product_id: string, quantity: number) {
      const cur = readCart().map((x) => x.product_id === product_id ? { ...x, quantity } : x).filter((x) => x.quantity > 0);
      writeCart(cur);
    },
    remove(product_id: string) { writeCart(readCart().filter((x) => x.product_id !== product_id)); },
    clear() { writeCart([]); },
    count: items.reduce((s, x) => s + x.quantity, 0),
  };
}
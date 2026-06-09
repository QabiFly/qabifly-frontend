import { create } from "zustand";
import { Cart } from "@/types";

interface CartStore {
  cart:    Cart | null;
  count:   number;
  setCart: (c: Cart | null) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  cart:    null,
  count:   0,
  setCart: (cart) => set({ cart, count: cart?.total_items ?? 0 }),
}));
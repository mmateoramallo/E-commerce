import { create } from "zustand";
import type { Product } from "../types/Product";

type CartItem = Product & {
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addToCart: (product) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === product.id);

    if (existingItem) {
      set({
        items: currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
      return;
    }

    set({
      items: [...currentItems, { ...product, quantity: 1 }],
    });
  },

  removeFromCart: (productId) => {
    set({
      items: get().items.filter((item) => item.id !== productId),
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },
}));
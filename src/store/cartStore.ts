import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types/Product";

export type CartItem = Product & {
  quantity: number;
};

type CartState = {
  items: CartItem[];
  lastAddedItem: Product | null;
  cartNotificationId: number;

  addToCart: (product: Product) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  getTotalItems: () => number;
  getTotalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastAddedItem: null,
      cartNotificationId: 0,

      addToCart: (product) => {
        if (product.stock <= 0) return;

        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          if (existingItem.quantity >= product.stock) return;

          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    ...product,
                    quantity: item.quantity + 1,
                  }
                : item
            ),
            lastAddedItem: product,
            cartNotificationId: get().cartNotificationId + 1,
          });

          return;
        }

        set({
          items: [...currentItems, { ...product, quantity: 1 }],
          lastAddedItem: product,
          cartNotificationId: get().cartNotificationId + 1,
        });
      },

      increaseQuantity: (productId) => {
        const currentItems = get().items;
        const selectedItem = currentItems.find((item) => item.id === productId);

        if (!selectedItem) return;
        if (selectedItem.quantity >= selectedItem.stock) return;

        set({
          items: currentItems.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        });
      },

      decreaseQuantity: (productId) => {
        const currentItems = get().items;
        const selectedItem = currentItems.find((item) => item.id === productId);

        if (!selectedItem) return;

        if (selectedItem.quantity <= 1) {
          set({
            items: currentItems.filter((item) => item.id !== productId),
          });

          return;
        }

        set({
          items: currentItems.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
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
    }),
    {
      name: "ecommerce-muebles-cart",
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
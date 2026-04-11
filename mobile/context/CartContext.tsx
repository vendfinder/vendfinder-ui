import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, CartItem } from "@vendfinder/shared";
import { getItem, setItem } from "@/lib/storage";

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number, size?: string) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function matchItem(item: CartItem, productId: string, size?: string) {
  return item.product.id === productId && (item.size || undefined) === (size || undefined);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getItem<CartItem[]>("vendfinder-cart").then((stored) => {
      if (stored) setItems(stored);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      setItem("vendfinder-cart", items);
    }
  }, [items, loaded]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const addItem = (product: Product, quantity = 1, size?: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => matchItem(i, product.id, size));
      if (existing) {
        return prev.map((i) =>
          matchItem(i, product.id, size)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, size }];
    });
  };

  const removeItem = (productId: string, size?: string) => {
    setItems((prev) => prev.filter((i) => !matchItem(i, productId, size)));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        matchItem(i, productId, size) ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  if (!loaded) return null;

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

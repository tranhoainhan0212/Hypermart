import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../services/api";
import type { RootState } from "./store";

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const LOCAL_KEY = "cart";

function readLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.productId === "string")
      .map((x) => ({ productId: x.productId, quantity: Number(x.quantity) || 0 }))
      .filter((x) => Number.isFinite(x.quantity) && x.quantity > 0);
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

async function persistToServer(items: CartItem[]) {
  await api.put("/api/cart/me", { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) });
}

export const loadCart = createAsyncThunk<CartItem[], void, { state: RootState }>(
  "cart/load",
  async (_void, { getState }) => {
    const { auth } = getState();
    if (!auth.user) return readLocalCart();

    const res = await api.get("/api/cart/me");
    const cart = res.data.cart as any;
    const items: CartItem[] = (cart?.items || []).map((i: any) => ({
      productId: i.product?._id || i.product || i._id,
      quantity: Number(i.quantity),
    }));
    return items.filter((x) => x.productId && x.quantity > 0);
  }
);

export const setCartItems = createAsyncThunk<void, CartItem[], { state: RootState }>(
  "cart/setItems",
  async (items, { getState }) => {
    const { auth } = getState();
    if (!auth.user) {
      writeLocalCart(items);
      return;
    }
    await persistToServer(items);
  }
);

export const cartSlice = createSlice({
  name: "cart",
  initialState: {
  items: [],   // ← khởi động rỗng, để loadCart điền vào
  loading: false,
  error: null,
} as CartState,
  reducers: {
    addItem(state, action: { payload: { productId: string; quantity: number } }) {
      const { productId, quantity } = action.payload;
      const idx = state.items.findIndex((i) => i.productId === productId);
      if (idx >= 0) state.items[idx].quantity += quantity;
      else state.items.push({ productId, quantity });
    },
    updateQuantity(state, action: { payload: { productId: string; quantity: number } }) {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.productId !== productId);
        return;
      }
      const idx = state.items.findIndex((i) => i.productId === productId);
      if (idx >= 0) state.items[idx].quantity = quantity;
    },
    removeItem(state, action: { payload: { productId: string } }) {
      state.items = state.items.filter((i) => i.productId !== action.payload.productId);
    },
    clearCart(state) {
      state.items = [];
    },
    setItems(state, action: { payload: CartItem[] }) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        writeLocalCart(action.payload); // ← ghi đè localStorage bằng data server
      })
      .addCase(loadCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load cart";
      })
      .addCase(setCartItems.pending, (state) => {
        state.error = null;
      })
      .addCase(setCartItems.rejected, (state, action) => {
        state.error = action.error.message || "Failed to set cart";
      });
      
  },
});

export const cartActions = cartSlice.actions;
export default cartSlice.reducer;


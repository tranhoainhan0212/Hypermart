import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../services/api";

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  images: ProductImage[];
  price: number;
  stock: number;
  category: ProductCategory;
  ratingAverage: number;
  ratingCount: number;
}

export interface ProductsListResponse {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsState {
  list: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  currentProduct: Product | null;
  currentLoading: boolean;
}

const initialState: ProductsState = {
  list: [],
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  loading: false,
  error: null,
  currentProduct: null,
  currentLoading: false,
};

export const fetchProducts = createAsyncThunk<
  ProductsListResponse,
  {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    page?: number;
    limit?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "rating_desc";
  }
>("products/fetchList", async (params) => {
  const res = await api.get("/api/products", { params });
  return res.data as ProductsListResponse;
});

export const fetchProductByIdOrSlug = createAsyncThunk<
  Product,
  { idOrSlug: string }
>("products/fetchByIdOrSlug", async ({ idOrSlug }) => {
  const res = await api.get(`/api/products/${encodeURIComponent(idOrSlug)}`);
  return (res.data as any).item as Product;
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearCurrent(state) {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.items;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load products";
      })
      .addCase(fetchProductByIdOrSlug.pending, (state) => {
        state.currentLoading = true;
        state.error = null;
      })
      .addCase(fetchProductByIdOrSlug.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductByIdOrSlug.rejected, (state, action) => {
        state.currentLoading = false;
        state.error = action.error.message || "Failed to load product";
      });
  },
});

export const productsActions = productsSlice.actions;
export default productsSlice.reducer;


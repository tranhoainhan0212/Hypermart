import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { PayloadAction } from "@reduxjs/toolkit";

import { api } from "../services/api";



export type Role = "user" | "admin";



export interface AuthUser {

  id: string;

  email: string;

  name: string;

  role: Role;

}



interface AuthState {

  user: AuthUser | null;

  accessToken: string | null;

  loading: boolean;

  error: string | null;

}



const initialState: AuthState = {

  user: null,

  accessToken: localStorage.getItem("accessToken"),

  loading: false,

  error: null,

};



export const register = createAsyncThunk<

  { user: AuthUser; accessToken: string; refreshToken?: string },

  { email: string; password: string; name?: string },

  { rejectValue: string }

>("auth/register", async (payload, { rejectWithValue }) => {

  try {

    const res = await api.post("/api/auth/register", payload);

    return res.data;

  } catch (e: any) {

    return rejectWithValue(e?.response?.data?.message || "Register failed");

  }

});



export const login = createAsyncThunk<

  { user: AuthUser; accessToken: string; refreshToken?: string },

  { email: string; password: string },

  { rejectValue: string }

>("auth/login", async (payload, { rejectWithValue }) => {

  try {

    const res = await api.post("/api/auth/login", payload);

    return res.data;

  } catch (e: any) {

    return rejectWithValue(e?.response?.data?.message || "Login failed");

  }

});



export const me = createAsyncThunk<

  { user: AuthUser },

  void,

  { rejectValue: string }

>("auth/me", async (_payload, { rejectWithValue }) => {

  try {

    const res = await api.get("/api/auth/me");

    return res.data;

  } catch (e: any) {

    return rejectWithValue(e?.response?.data?.message || "Session expired");

  }

});



export const logout = createAsyncThunk<void, void, { rejectValue: string }>(

  "auth/logout",

  async (_payload, { rejectWithValue }) => {

    try {

      await api.post("/api/auth/logout");

    } catch (e: any) {

      return rejectWithValue(e?.response?.data?.message || "Logout failed");

    }

  }

);



const authSlice = createSlice({

  name: "auth",

  initialState,

  reducers: {

    setAccessToken(state, action: PayloadAction<string | null>) {

      state.accessToken = action.payload;

    },

    logoutLocal(state) {

      state.user = null;

      state.accessToken = null;

      state.loading = false;

      state.error = null;

      localStorage.removeItem("accessToken");

      localStorage.removeItem("refreshToken");

    },

  },

  extraReducers: (builder) => {

    builder

      // ============ REGISTER ============
      .addCase(register.pending, (state) => {

        state.loading = true;

        state.error = null;

      })

      .addCase(register.fulfilled, (state, action) => {

        state.loading = false;

        state.user = action.payload.user;

        state.accessToken = action.payload.accessToken;

        localStorage.setItem("accessToken", action.payload.accessToken);

        // ✅ Lưu refreshToken nếu backend gửi
        if (action.payload.refreshToken) {

          localStorage.setItem("refreshToken", action.payload.refreshToken);

        }

      })

      .addCase(register.rejected, (state, action) => {

        state.loading = false;

        state.error = action.payload || "Register failed";

      })

      // ============ LOGIN ============
      .addCase(login.pending, (state) => {

        state.loading = true;

        state.error = null;

      })

      .addCase(login.fulfilled, (state, action) => {

        state.loading = false;

        state.user = action.payload.user;

        state.accessToken = action.payload.accessToken;

        localStorage.setItem("accessToken", action.payload.accessToken);

        // ✅ Lưu refreshToken nếu backend gửi
        if (action.payload.refreshToken) {

          localStorage.setItem("refreshToken", action.payload.refreshToken);

        }

      })

      .addCase(login.rejected, (state, action) => {

        state.loading = false;

        state.error = action.payload || "Login failed";

      })

      // ============ ME (Get User Info) ============
      .addCase(me.pending, (state) => {

        state.loading = true;

      })

      .addCase(me.fulfilled, (state, action) => {

        state.loading = false;

        state.user = action.payload.user;

        state.error = null;

      })

      .addCase(me.rejected, (state, action) => {

        state.loading = false;

        state.user = null;

        state.accessToken = null;

        state.error = action.payload || "Session expired";

        // ✅ Xóa token khi 401
        localStorage.removeItem("accessToken");

        localStorage.removeItem("refreshToken");

      })

      // ============ LOGOUT ============
      .addCase(logout.pending, (state) => {

        state.loading = true;

      })

      .addCase(logout.fulfilled, (state) => {

        state.loading = false;

        state.user = null;

        state.accessToken = null;

        state.error = null;

        localStorage.removeItem("accessToken");

        localStorage.removeItem("refreshToken");

      })

      .addCase(logout.rejected, (state, action) => {

        state.loading = false;

        state.error = action.payload || "Logout failed";

        // ✅ Vẫn xóa token ngay cả khi logout API thất bại
        state.user = null;

        state.accessToken = null;

        localStorage.removeItem("accessToken");

        localStorage.removeItem("refreshToken");

      });

  },

});



export const { setAccessToken, logoutLocal } = authSlice.actions;

export const authActions = authSlice.actions;

export default authSlice.reducer;
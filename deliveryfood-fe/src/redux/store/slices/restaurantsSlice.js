// src/redux/store/slices/restaurantsSlice.js
import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

// GET /api/v1/restaurants?sort=-createdAt&limit=...
export const fetchRestaurants = createAsyncThunk(
  "restaurants/fetchRestaurants",
  async ({ limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_BASE}/restaurants`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { sort: "-createdAt", limit }, 
      });
      return res?.data?.data ?? res?.data ?? [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET /api/v1/restaurants/{id}
export const fetchRestaurantById = createAsyncThunk(
  "restaurants/fetchRestaurantById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_BASE}/restaurants/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res?.data?.data ?? res?.data ?? null;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchNearbyRestaurants = createAsyncThunk(
  "restaurants/fetchNearby",
  async ({ latitude, longitude, maxDistance = 5000 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_BASE}/restaurants/nearby`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { latitude, longitude, maxDistance },
      });
      // res.data có mảng object kèm dist.calculated
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const restaurantsSlice = createSlice({
  name: "restaurants",
  initialState: {
    items: [],
    nearby: [],           // <- danh sách gần bạn
    itemById: {},
    loading: false,
    nearbyLoading: false,
    error: "",
    nearbyError: "",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // list
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        const data = Array.isArray(action.payload) ? action.payload : [];
        // Fallback sort FE theo createdAt DESC
        state.items = [...data].sort(
          (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)
        );
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không tải được danh sách nhà hàng";
      })

      // detail
      .addCase(fetchRestaurantById.pending, (state) => {
        state.error = "";
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        const r = action.payload;
        if (r && (r._id || r.id)) state.itemById[r._id || r.id] = r;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.error = action.payload || "Không tải được chi tiết nhà hàng";
      })
      .addCase(fetchNearbyRestaurants.pending, (state) => {
        state.nearbyLoading = true;
        state.nearbyError = "";
      })
      .addCase(fetchNearbyRestaurants.fulfilled, (state, action) => {
        state.nearbyLoading = false;
        state.nearby = action.payload;
      })
      .addCase(fetchNearbyRestaurants.rejected, (state, action) => {
        state.nearbyLoading = false;
        state.nearbyError = action.payload || "Không tải được quán gần bạn";
      });
    
  },
});

export default restaurantsSlice.reducer;

// ===== Selectors =====
export const selectRestaurants = (state) => state.restaurants.items;
export const selectRestaurantsLoading = (state) => state.restaurants.loading;
export const selectRestaurantsError = (state) => state.restaurants.error;


export const selectNearby = (state) => state.restaurants.nearby;
export const selectNearbyLoading = (state) => state.restaurants.nearbyLoading;
export const selectNearbyError = (state) => state.restaurants.nearbyError;
// Lọc shop mới tạo nhất (n shop)
export const makeSelectNewestRestaurants = (n = 10) =>
  createSelector([selectRestaurants], (items) =>
    [...items]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, n)
  );

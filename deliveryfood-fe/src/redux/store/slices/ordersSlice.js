// src/redux/store/slices/ordersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const apiBase = process.env.REACT_APP_API_BASE || "";

// auth headers helper
const authHeaders = () => {
  try {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

/** Helper to normalize API responses into an array of orders */
const normalizeOrdersResponse = (res) => {
  // possible shapes:
  // 1) res.data.data.data -> array (your current /orders/me)
  // 2) res.data.data -> array
  // 3) res.data -> array
  // 4) res.data.data -> object (single order) -> wrap into [obj]
  const body = res?.data;
  if (!body) return [];

  // case: body.data.data (inner wrapper)
  if (body.data && Array.isArray(body.data.data)) return body.data.data;

  // case: body.data is already an array
  if (Array.isArray(body.data)) return body.data;

  // case: body is an array (unlikely here)
  if (Array.isArray(body)) return body;

  // case: body.data is a single object -> wrap
  if (body.data && typeof body.data === "object") return [body.data];

  // fallback: if body itself is a single object that looks like an order
  if (typeof body === "object") {
    // try to detect order-like object (has _id or id)
    if (body._id || body.id || body.restaurant) return [body];
  }

  return [];
};

/* -------------------
  Thunks
---------------------*/

export const createOrderFromRestaurant = createAsyncThunk(
  "orders/createOrderFromRestaurant",
  async ({ restaurantId, orderData }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        `${apiBase}/orders/restaurant/${restaurantId}`,
        orderData,
        { headers: authHeaders() }
      );
      // try to return created order object (normalize single)
      const body = res.data;
      // common shapes: { data: { ...order... } } or { data: order } or order
      const created = body?.data || body;
      return created;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tạo đơn hàng từ nhà hàng");
    }
  }
);

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${apiBase}/orders`, { headers: authHeaders() });
      return normalizeOrdersResponse(res);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải danh sách đơn hàng");
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${apiBase}/orders/me`, { headers: authHeaders() });
      return normalizeOrdersResponse(res);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải đơn hàng của tôi");
    }
  }
);

/*
 fetchOrderById: smart thunk
  - if order exists in state.orders.myOrders -> return it (no network)
  - else -> GET /orders/:id
*/
export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (orderId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const myOrders = state.orders?.myOrders || [];
      const found =
        myOrders.find((o) => (o._id || o.id || "").toString() === orderId.toString() ) ||
        myOrders.find((o) => (o.id || o._id || "").toString() === orderId.toString());

      if (found) {
        return found;
      }

      const res = await axios.get(`${apiBase}/orders/${orderId}`, { headers: authHeaders() });
      // normalize single order response: try res.data.data or res.data
      const body = res.data;
      return body?.data || body;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải chi tiết đơn hàng");
    }
  }
);

const initialState = {
  orders: [],
  myOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
  createOrderLoading: false,
  createOrderError: null,
  lastCreatedOrder: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createOrderError = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearLastCreatedOrder: (state) => {
      state.lastCreatedOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order from restaurant
      .addCase(createOrderFromRestaurant.pending, (state) => {
        state.createOrderLoading = true;
        state.createOrderError = null;
      })
      .addCase(createOrderFromRestaurant.fulfilled, (state, action) => {
        state.createOrderLoading = false;
        const payload = action.payload;
        // payload can be object (created order) or array (rare)
        const newOrder = Array.isArray(payload) ? payload[0] : payload;
        state.lastCreatedOrder = newOrder || null;
        // prepend to myOrders so orders/me view is up-to-date
        state.myOrders = Array.isArray(state.myOrders) ? (newOrder ? [newOrder, ...state.myOrders] : state.myOrders) : (newOrder ? [newOrder] : []);
      })
      .addCase(createOrderFromRestaurant.rejected, (state, action) => {
        state.createOrderLoading = false;
        state.createOrderError = action.payload;
      })

      // Fetch all orders (admin)
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch my orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        // ensure it's an array
        state.myOrders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch order by id (smart)
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentOrder, clearLastCreatedOrder } = ordersSlice.actions;
export default ordersSlice.reducer;

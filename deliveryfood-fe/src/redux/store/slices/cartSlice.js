import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* ============ Helpers ============ */
const apiBase = process.env.REACT_APP_API_BASE || "";

const authHeaders = () => {
  try {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const optionKeyOf = (selectedOptions = []) => {
  const arr = Array.isArray(selectedOptions) ? selectedOptions : [];
  const ids = arr.map((o) => (o?._id || o?.id || o)).filter(Boolean);
  return ids.sort().join(",");
};

const keyOf = ({ menuId, selectedOptions = [] }) =>
  `${menuId}|${optionKeyOf(selectedOptions)}`;

const toId = (v) => (v?._id || v?.id || v);
const toIdArr = (arr) => (Array.isArray(arr) ? arr.map(toId).filter(Boolean) : []);

/** Đơn giá chuẩn = basePrice + sum(option.priceDelta) */
const unitPriceOf = (item) => {
  const base =
    item?.basePrice ??
    item?.menuItem?.basePrice ??
    item?.menu?.basePrice ??
    item?.price ??
    0;
  const n = Number(base);
  return Number.isFinite(n) ? n : 0;
};

const optionsDeltaOf = (item) => {
  const arr = Array.isArray(item?.selectedOptions) ? item.selectedOptions : [];
  return arr.reduce(
    (s, op) => s + Number(op?.priceDelta ?? op?.price_delta ?? 0),
    0
  );
};

const getPrice = (item) => unitPriceOf(item) + optionsDeltaOf(item);

const recomputeTotals = (state) => {
  state.itemCount = state.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  state.totalAmount = state.items.reduce(
    (s, it) => s + getPrice(it) * Number(it.quantity || 0),
    0
  );
};

/* ==== Extract & Normalize (flatten restaurant + menu info) ==== */
const extractRestaurant = (sv) => {
  const r =
    sv?.menuItem?.menu?.restaurant ??
    sv?.menuItem?.restaurant ??
    sv?.menu?.restaurant ??
    sv?.restaurant ??
    null;
  return r;
};

const canComputeUnit = (x) =>
  x?.basePrice != null ||
  x?.menuItem?.basePrice != null ||
  x?.menuItem?.price != null ||
  x?.menu?.basePrice != null ||
  x?.price != null;

const normalizeServerItem = (sv) => {
  const id = sv?.id || sv?._id;
  const menuId = sv?.menuItem?._id || sv?.menuItem || sv?.menu_id || sv?.menuId;
  const selectedOptions = sv?.selectedOptions || [];

  const miObj = (sv && typeof sv.menuItem === "object") ? sv.menuItem : null;
  const menuTitle = miObj?.title || miObj?.name || sv?.name || "";
  const menuImage = miObj?.image || miObj?.thumbnail || sv?.image || null;

  const r = extractRestaurant(sv);
  const rObj = r && typeof r === "object" ? r : null;

  const restaurantId =
    rObj?._id ||
    rObj?.id ||
    sv?.restaurantId ||
    (typeof r === "string" ? r : undefined) ||
    "unknown";

  const base = {
    ...sv,
    id,
    _clientKey: keyOf({ menuId, selectedOptions }),
    isTemporary: false,

    // Flatten restaurant
    restaurantId: String(restaurantId),
    restaurantName: rObj?.name || sv?.restaurantName || "",
    restaurantImage: rObj?.image || sv?.restaurantImage || null,
    restaurantAddress: rObj?.address || sv?.restaurantAddress || "",
    restaurantIsOpen: !!(rObj?.isOpen ?? sv?.restaurantIsOpen),

    // Flatten menu
    menuTitle,
    menuImage,
  };

  return canComputeUnit(sv) ? { ...base, price: getPrice(sv) } : base;
};

const isPopulated = (x) =>
  x &&
  typeof x === "object" &&
  (x.title || x.name || x.image || x.thumbnail || x.basePrice != null);

const keepPopulated = (prev, next) => {
  if (isPopulated(next)) return next; // next là object giàu field
  if (isPopulated(prev) && (next == null || typeof next !== "object")) return prev; // next là id
  return next ?? prev;
};

const pick = (next, prev) => (next !== undefined ? next : prev);

const mergePreservePopulated = (prev, nextNorm) => {
  if (!prev) return nextNorm;

  const merged = {
    ...prev,
    ...nextNorm,

    // Giữ object populate
    menuItem: keepPopulated(prev.menuItem, nextNorm.menuItem),
    menu: keepPopulated(prev.menu, nextNorm.menu),

    // Giữ flatten nếu next thiếu
    restaurantId: nextNorm.restaurantId || prev.restaurantId,
    restaurantName: nextNorm.restaurantName || prev.restaurantName,
    restaurantImage: nextNorm.restaurantImage || prev.restaurantImage,
    restaurantAddress: nextNorm.restaurantAddress || prev.restaurantAddress,
    restaurantIsOpen:
      typeof nextNorm.restaurantIsOpen === "boolean" ? nextNorm.restaurantIsOpen : prev.restaurantIsOpen,

    // Flatten menu
    menuTitle: nextNorm.menuTitle || prev.menuTitle,
    menuImage: nextNorm.menuImage || prev.menuImage,

    // Dynamic fields
    selectedOptions: pick(nextNorm.selectedOptions, prev.selectedOptions),
    quantity: pick(nextNorm.quantity, prev.quantity),
    price: pick(nextNorm.price, prev.price),
  };

  merged.price = getPrice(merged);
  return merged;
};

/* ============ Async thunks (API) ============ */

export const fetchActiveCarts = createAsyncThunk(
  "cart/fetchActiveCarts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${apiBase}/carts/me/active`, { headers: authHeaders() });
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải danh sách giỏ");
    }
  }
);

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${apiBase}/carts/me/active`, { headers: authHeaders() });
    return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải giỏ hàng");
    }
  }
);

export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${apiBase}/cart_items/me`, { headers: authHeaders() });
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi tải sản phẩm trong giỏ");
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ menuId, quantity = 1, selectedOptions = [] }, { rejectWithValue }) => {
    try {
      const body = { items: [{ menuItem: menuId, quantity, selectedOptions: toIdArr(selectedOptions) }] };
      const response = await axios.post(`${apiBase}/cart_items/me`, body, { headers: authHeaders() });
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi thêm vào giỏ hàng");
    }
  }
);

// Gửi đúng schema { menuItem, quantity, selectedOptions }
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity, selectedOptions, menuItem }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const curr = state.cart.items.find((it) => (it.id || it._id) === itemId);

      const menuItemId =
        menuItem ||
        curr?.menuItem?._id ||
        curr?.menuItem ||
        curr?.menu_id ||
        curr?.menuId;

      const body = {
        menuItem: menuItemId,
        quantity,
        selectedOptions:
          selectedOptions != null ? toIdArr(selectedOptions) : toIdArr(curr?.selectedOptions),
      };

      const response = await axios.put(`${apiBase}/cart_items/me/${itemId}`, body, { headers: authHeaders() });
      return response.data?.data ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi cập nhật giỏ hàng");
    }
  }
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (itemId, { rejectWithValue }) => {
    try {
      await axios.delete(`${apiBase}/cart_items/me/${itemId}`, { headers: authHeaders() });
      return itemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi xóa khỏi giỏ hàng");
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete(`${apiBase}/carts/me/active`, { headers: authHeaders() });
      return true;
    } catch (e1) {
      try {
        await axios.delete(`${apiBase}/cart_items/me`, { headers: authHeaders() });
        return true;
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Lỗi khi xóa giỏ hàng");
      }
    }
  }
);

export const clearCartByRestaurant = createAsyncThunk(
  "cart/clearCartByRestaurant",
  async (restaurantId, { rejectWithValue }) => {
    try {
      await axios.delete(`${apiBase}/carts/me/active/${restaurantId}`, { headers: authHeaders() });
      return restaurantId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi khi xoá giỏ của nhà hàng");
    }
  }
);

/* ============ State ============ */
const initialState = {
  items: [],
  cart: null,
  carts: [],
  itemCount: 0,
  totalAmount: 0,
  loading: false,
  error: null,
  lastAddedItem: null,
};

/* ============ Slice ============ */
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearLastAddedItem: (state) => { state.lastAddedItem = null; },

    forceUpdateCart: (state) => {
      state.items = [...state.items];
      recomputeTotals(state);
    },

    optimisticAddToCart: (state, action) => {
      const { menu, quantity = 1, notes = "", selectedOptions = [] } = action.payload;
      const menuId = menu?.id || menu?._id || action.payload?.menuId;
      if (!menuId) return;

      const r = menu?.restaurant;
      const rObj = r && typeof r === "object" ? r : null;
      const restaurantId = String(rObj?._id || rObj?.id || (typeof r === "string" ? r : "unknown"));
      const restaurantName = rObj?.name || "";

      const k = keyOf({ menuId, selectedOptions });

      const existing =
        state.items.find((it) => it._clientKey === k) ||
        state.items.find(
          (it) =>
            (it.menu_id === menuId || it.menuId === menuId) &&
            optionKeyOf(it.selectedOptions || []) === optionKeyOf(selectedOptions)
        );

      if (existing) {
        existing.quantity = Number(existing.quantity || 0) + Number(quantity || 0);
        existing.notes = notes ?? existing.notes ?? "";
        existing.selectedOptions = selectedOptions;
        existing._clientKey = k;
        existing.restaurantId = existing.restaurantId || restaurantId;
        existing.restaurantName = existing.restaurantName || restaurantName;
      } else {
        state.items.push({
          id: `temp_${Date.now()}`,
          menu_id: menuId,
          menu,
          quantity: Number(quantity || 1),
          notes,
          price:
            (menu?.basePrice ?? menu?.price ?? 0) +
            (Array.isArray(selectedOptions)
              ? selectedOptions.reduce((s, op) => s + (op?.priceDelta ?? 0), 0)
              : 0),
          selectedOptions,
          isTemporary: true,
          _clientKey: k,
          restaurantId,
          restaurantName,
          // flatten menu để UI chắc chắn hiện tên/ảnh
          menuTitle: menu?.title || menu?.name || "",
          menuImage: menu?.image || menu?.thumbnail || null,
        });
      }

      state.items = [...state.items];
      recomputeTotals(state);
    },

    rollbackOptimisticAdd: (state, action) => {
      const { menu, quantity = 1, selectedOptions = [] } = action.payload || {};
      const menuId = menu?.id || menu?._id || action.payload?.menuId;
      if (!menuId) return;

      const k = keyOf({ menuId, selectedOptions });
      const idx = state.items.findIndex((it) => it._clientKey === k || it.menu_id === menuId);
      if (idx >= 0) {
        state.items[idx].quantity = Number(state.items[idx].quantity || 0) - Number(quantity || 0);
        if (state.items[idx].quantity <= 0) state.items.splice(idx, 1);
      }

      state.items = state.items.filter((it) => !(it.isTemporary && it.quantity <= 0));
      recomputeTotals(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveCarts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchActiveCarts.fulfilled, (state, action) => {
        state.loading = false;
        state.carts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchActiveCarts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchCart.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.carts = Array.isArray(action.payload) ? action.payload : [];
        state.cart = null;
      })
      .addCase(fetchCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchCartItems.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        const arr = Array.isArray(action.payload) ? action.payload : [];
        state.items = arr.map((x) => {
          const u = normalizeServerItem(x);
          return { ...u, price: getPrice(u) };
        });
        recomputeTotals(state);
      })
      .addCase(fetchCartItems.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(addToCart.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;

        if (Array.isArray(payload)) {
          state.items = payload.map((x) => {
            const u = normalizeServerItem(x);
            return { ...u, price: getPrice(u) };
          });
        } else if (payload) {
          const u = normalizeServerItem(payload);
          const idx = state.items.findIndex((it) => (it.id || it._id) === u.id);
          if (idx >= 0) {
            state.items = state.items.map((it) => {
              if ((it.id || it._id) !== u.id) return it;
              const merged = mergePreservePopulated(it, u);
              return { ...merged, price: getPrice(merged) };
            });
          } else {
            const withPrice = { ...u, price: getPrice(u) };
            state.items = [...state.items, withPrice];
          }
        }
        recomputeTotals(state);
      })
      .addCase(addToCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(updateCartItem.pending, (state, action) => {
        state.loading = true;
        const { itemId, quantity } = action.meta.arg || {};
        if (!itemId || !Number.isFinite(quantity)) return;

        state.items = state.items
          .map((it) => {
            const id = it.id || it._id;
            if (id !== itemId) return it;
            if (quantity <= 0) return null;
            return { ...it, quantity };
          })
          .filter(Boolean);

        recomputeTotals(state);
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;

        if (Array.isArray(payload)) {
          state.items = payload.map((x) => {
            const u = normalizeServerItem(x);
            return { ...u, price: getPrice(u) };
          });
        } else if (payload) {
          const u = normalizeServerItem(payload);
          const idx = state.items.findIndex((it) => (it.id || it._id) === u.id);
          if (idx >= 0) {
            state.items = state.items.map((it) => {
              if ((it.id || it._id) !== u.id) return it;
              const merged = mergePreservePopulated(it, u);
              return { ...merged, price: getPrice(merged) };
            });
          } else {
            const withPrice = { ...u, price: getPrice(u) };
            state.items = [...state.items, withPrice];
          }
        }
        recomputeTotals(state);
      })
      .addCase(updateCartItem.rejected, (state, action) => { state.loading = false; state.error = action.payload || "Lỗi khi cập nhật giỏ hàng"; })

      .addCase(removeFromCart.pending, (state) => { state.loading = true; })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        const itemId = action.payload;
        state.items = state.items.filter((it) => (it.id || it._id) !== itemId);
        recomputeTotals(state);
      })
      .addCase(removeFromCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(clearCart.pending, (state) => { state.loading = true; })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.cart = null;
        state.carts = [];
        state.itemCount = 0;
        state.totalAmount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(clearCartByRestaurant.pending, (state) => { state.loading = true; })
      .addCase(clearCartByRestaurant.fulfilled, (state) => { state.loading = false; })
      .addCase(clearCartByRestaurant.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const {
  clearError,
  clearLastAddedItem,
  optimisticAddToCart,
  rollbackOptimisticAdd,
  forceUpdateCart,
} = cartSlice.actions;

export const addToCartOptimistic =
  ({ menu, quantity = 1, selectedOptions = [] }) =>
  async (dispatch) => {
    const menuId = menu?.id || menu?._id;

    dispatch(cartSlice.actions.optimisticAddToCart({ menu, quantity, selectedOptions }));

    try {
      await dispatch(addToCart({ menuId, quantity, selectedOptions })).unwrap();
      await dispatch(fetchCartItems()).unwrap();
      dispatch(cartSlice.actions.forceUpdateCart());
    } catch (e) {
      dispatch(cartSlice.actions.rollbackOptimisticAdd({ menu, quantity, selectedOptions }));
      throw e;
    }
  };

export default cartSlice.reducer;

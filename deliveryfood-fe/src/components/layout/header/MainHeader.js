import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation, matchPath } from "react-router-dom";
import axios from "axios";



import CartDrawer from "../../common/CartDrawer";
import { Layout as AntLayout, Grid, theme, message } from "antd";

import MobileHeader from "./MobileHeader";
import DesktopHeader from "./DesktopHeader";
import MobileMenuDrawer from "./MobileMenuDrawer";
import { clearCartByRestaurant, fetchCartItems, forceUpdateCart, removeFromCart, updateCartItem } from "../../../redux/store/slices/cartSlice";
import { useAppDispatch } from "../../../redux/store/store";
import { logout, setAuthMode, setShowAuthModal } from "../../../redux/store/slices/userSlice";
import { restaurantInfoOf } from "../../common/CartUtils";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";

const { Header } = AntLayout;
const { useBreakpoint } = Grid;

export default function MainHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const apiBase = process.env.REACT_APP_API_BASE || "";
  const screens = useBreakpoint();
  const { token } = theme.useToken();

  const { isLoggedIn, user } = useAppSelector((s) => s.user);
  const { items, loading: cartLoading, error: cartError } = useAppSelector((s) => s.cart);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentRestaurantId = useMemo(() => {
    const patterns = ["/restaurants/:id", "/restaurant/:id", "/store/:id"];
    for (const p of patterns) {
      const m = matchPath({ path: p, end: false }, location.pathname);
      if (m?.params?.id) return m.params.id.toString();
    }
    const sp = new URLSearchParams(location.search);
    return sp.get("restaurantId") || null;
  }, [location.pathname, location.search]);

  // Build groups by restaurant
  const groups = useMemo(() => {
    const map = new Map();
    (items || []).forEach((it) => {
      const info = restaurantInfoOf(it);
      if (!map.has(info.id)) {
        map.set(info.id, { ...info, items: [] });
      }
      map.get(info.id).items.push(it);
    });
    return Array.from(map.values());
  }, [items]);

  const visibleGroups = useMemo(() => {
    if (currentRestaurantId) {
      const g = groups.find((x) => x.id === currentRestaurantId);
      return g ? [g] : [];
    }
    return groups;
  }, [groups, currentRestaurantId]);

  const badgeCount = useMemo(() => {
    if (!isLoggedIn || !currentRestaurantId) return 0;
    const g = groups.find((x) => x.id === currentRestaurantId);
    if (!g) return 0;
    return g.items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  }, [groups, isLoggedIn, currentRestaurantId]);

  useEffect(() => {
    if (isLoggedIn) dispatch(fetchCartItems());
  }, [isLoggedIn, dispatch]);

  const handleLogin = () => {
    if (!isLoggedIn) {
      dispatch(setAuthMode("login"));
      dispatch(setShowAuthModal(true));
    }
  };

  const handleLogout = async () => {
  try {
    await axios.post(`${apiBase}/auth/logout`);
  } catch {}

  dispatch(logout());

  
  // (khuyến nghị) clear cart UI để không còn dữ liệu cũ
  dispatch(clearCartByRestaurant(currentRestaurantId)); // nếu muốn clear theo restaurant
  // hoặc nếu slice có action clearCart() thì dùng clearCart()

  setIsCartOpen(false);
  setIsMobileMenuOpen(false);

  message.success("Đăng xuất thành công");

  // ✅ đẩy về trang "/"
  navigate("/", { replace: true });
};


  const handleCartClick = useCallback(() => {
    if (!isLoggedIn) {
      handleLogin();
    } else {
      setIsCartOpen(true);
      dispatch(fetchCartItems());
    }
  }, [isLoggedIn, dispatch]);

  // Cart handlers
  const handleUpdateQuantity = useCallback(
    async (item, newQuantity) => {
      try {
        const itemId = item?.id || item?._id;
        const menuItemId = item?.menuItem?._id || item?.menuItem || item?.menu_id || item?.menuId;
        const selectedOptions = item?.selectedOptions;
        await dispatch(
          updateCartItem({ itemId, quantity: newQuantity, menuItem: menuItemId, selectedOptions })
        ).unwrap();
        dispatch(forceUpdateCart());
      } catch (error) {
        console.error("Update failed:", error);
        dispatch(fetchCartItems());
      }
    },
    [dispatch]
  );

  const handleRemoveItem = useCallback(
    async (itemId) => {
      try {
        await dispatch(removeFromCart(itemId)).unwrap();
        dispatch(forceUpdateCart());
      } catch (error) {
        console.error("Remove failed:", error);
        dispatch(fetchCartItems());
      }
    },
    [dispatch]
  );

  const handleClearGroup = useCallback(
    async (groupId) => {
      try {
        await dispatch(clearCartByRestaurant(groupId)).unwrap();
        await dispatch(fetchCartItems());
      } catch (error) {
        console.error("Clear group failed:", error);
      }
    },
    [dispatch]
  );

  const goCheckoutForGroup = (group) => {
    const ids = group.items.map((it) => it?.id || it?._id);
    navigate("/checkout", { state: { selectedItemIds: ids, restaurantId: group.id } });
    setIsCartOpen(false);
  };

  return (
    <>
      <Header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: "0 16px",
          height: 64,
          lineHeight: "normal",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}
        >
          {screens.xs ? (
            <MobileHeader
              isLoggedIn={isLoggedIn}
              badgeCount={badgeCount}
              onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              onCartClick={handleCartClick}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          ) : (
            <DesktopHeader
              isLoggedIn={isLoggedIn}
              user={user}
              badgeCount={badgeCount}
              onCartClick={handleCartClick}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          )}
        </div>
      </Header>

      <MobileMenuDrawer
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      <CartDrawer
        open={isCartOpen && isLoggedIn}
        onClose={() => setIsCartOpen(false)}
        groups={visibleGroups}
        loading={cartLoading}
        error={cartError}
        currentRestaurantId={currentRestaurantId}
        onUpdateQty={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearGroup={handleClearGroup}
        goCheckoutForGroup={goCheckoutForGroup}
      />
    </>
  );
}
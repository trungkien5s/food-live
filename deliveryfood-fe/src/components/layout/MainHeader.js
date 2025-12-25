import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useLocation, matchPath } from "react-router-dom";
import axios from "axios";
import { useAppSelector } from "../../redux/hooks/useAppSelector";
import { useAppDispatch } from "../../redux/store/store";
import { logout, setAuthMode, setShowAuthModal } from "../../redux/store/slices/userSlice";
import {
  fetchCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  clearCartByRestaurant,
  forceUpdateCart,
} from "../../redux/store/slices/cartSlice";

// Ant Design
import {
  Layout as AntLayout,
  Row,
  Col,
  Input,
  Button,
  Badge,
  Dropdown,
  Space,
  Avatar,
  Grid,
  theme,
  message,
  Modal,
  Flex,
  Drawer,
  Menu,
} from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  MessageOutlined,
  DownOutlined,
  MenuOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  ShopOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

import SearchBar from "../common/SearchBar";
import CartDrawer from "../common/CartDrawer";
import { restaurantInfoOf } from "../common/CartUtils";

const { Header } = AntLayout;
const { useBreakpoint } = Grid;

// Custom hook for geolocation with Leaflet
const useGeolocationWithLeaflet = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    address: {
      detailed: "",
      short: "",
      full: ""
    }
  });

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=vi`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      const address = data.address || {};
      const displayName = data.display_name || '';

      const parts = [];
      let short = '';

      if (address.house_number && address.road) {
        parts.push(`${address.house_number} ${address.road}`);
        short = `${address.house_number} ${address.road}`;
      } else if (address.road) {
        parts.push(address.road);
        short = address.road;
      }

      if (address.suburb) parts.push(address.suburb);
      if (address.quarter) parts.push(`Phường ${address.quarter}`);
      if (address.ward) parts.push(`Phường ${address.ward}`);
      if (address.village) parts.push(address.village);

      if (address.city_district) parts.push(`Quận ${address.city_district}`);
      else if (address.county) parts.push(address.county);
      else if (address.district) parts.push(address.district);

      if (address.city) parts.push(address.city);
      else if (address.town) parts.push(address.town);
      else if (address.state) parts.push(address.state);

      const detailed = parts.join(", ").trim();

      const finalDetailed = (detailed && detailed.length > 4) ? detailed : (displayName || "Không xác định được địa chỉ");
      const finalShort = short || (parts.length ? `${parts[0]}${parts[1] ? ', ' + parts[1] : ''}` : displayName);

      return {
        detailed: finalDetailed,
        short: finalShort || finalDetailed,
        full: displayName || finalDetailed
      };
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return {
        detailed: "Lỗi khi lấy địa chỉ",
        short: "Lỗi khi lấy địa chỉ",
        full: "Lỗi khi lấy địa chỉ"
      };
    }
  };

  const getCurrentLocation = useCallback(() => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: "Trình duyệt không hỗ trợ định vị" }));
      return;
    }

    const success = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("GPS coords:", latitude, longitude, "accuracy:", accuracy);

      const ACCEPTABLE_ACCURACY = 80;
      if (typeof accuracy === 'number' && accuracy > ACCEPTABLE_ACCURACY) {
        console.warn(`Accuracy thấp (${accuracy}m). Có thể chỉ nhận được địa chỉ chung.`);
      }

      const addressData = await reverseGeocode(latitude, longitude);

      const lastGood = localStorage.getItem('lastGoodAddress');
      const isDetailedEnough = addressData.detailed && addressData.detailed.length > 10 && !/^Quận|^Huyện|^Thành phố/i.test(addressData.detailed);

      if (isDetailedEnough) {
        localStorage.setItem('lastGoodAddress', JSON.stringify({ lat: latitude, lng: longitude, address: addressData }));
      }

      setLocation({
        latitude,
        longitude,
        address: isDetailedEnough ? addressData : (lastGood ? JSON.parse(lastGood).address : addressData),
        loading: false,
        error: null,
      });
    };

    const error = (err) => {
      console.error("Geolocation error:", err);
      let errorMessage = "Không thể lấy vị trí";
      switch (err.code) {
        case err.PERMISSION_DENIED: errorMessage = "Vui lòng cho phép truy cập vị trí"; break;
        case err.POSITION_UNAVAILABLE: errorMessage = "Vị trí không khả dụng"; break;
        case err.TIMEOUT: errorMessage = "Hết thời gian chờ"; break;
        default: errorMessage = "Lỗi không xác định"; break;
      }
      setLocation(prev => ({ ...prev, loading: false, error: errorMessage }));
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    ...location,
    refetch: getCurrentLocation
  };
};

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
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Sử dụng custom hook cho geolocation
  const {
    latitude,
    longitude,
    address,
    loading: locLoading,
    error: locError,
    refetch: refetchLocation
  } = useGeolocationWithLeaflet();

  const currentRestaurantId = useMemo(() => {
    const patterns = ["/restaurants/:id", "/restaurant/:id", "/store/:id"];
    for (const p of patterns) {
      const m = matchPath({ path: p, end: false }, location.pathname);
      if (m?.params?.id) return m.params.id.toString();
    }
    const sp = new URLSearchParams(location.search);
    return sp.get("restaurantId") || null;
  }, [location.pathname, location.search]);

  // Build groups by restaurant using same rules you had
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
    } catch { }
    dispatch(logout());
    message.success("Đăng xuất thành công");
  };

  const handleCartClick = useCallback(() => {
    if (!isLoggedIn) {
      handleLogin();
    } else {
      setIsCartOpen(true);
      dispatch(fetchCartItems());
    }
  }, [isLoggedIn, dispatch]);

  // Location handlers
  const handleLocationClick = () => {
    if (locError) {
      refetchLocation();
    } else {
      setShowLocationModal(true);
    }
  };

  const handleLocationPermission = () => {
    refetchLocation();
    setShowLocationModal(false);
  };

  // truncate to N words (default 3)
  const truncateWords = (s = "", n = 3) => {
    if (!s) return s;
    const words = s.trim().split(/\s+/);
    if (words.length <= n) return s;
    return words.slice(0, n).join(" ") + "...";
  };

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

  const menuItems = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      onClick: () => navigate("/profile"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  // Render location display
  const renderLocationDisplay = () => {
    if (locLoading) {
      return (
        <Space size={4} align="center">
          <LoadingOutlined spin />
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>Đang định vị...</span>
        </Space>
      );
    }

    if (locError) {
      return (
        <Button
          type="link"
          size="small"
          onClick={handleLocationClick}
          style={{
            padding: '0 4px',
            height: 'auto',
            color: '#f5222d',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Space size={4} align="center">
            <EnvironmentOutlined />
            <span>{locError}</span>
          </Space>
        </Button>
      );
    }

    if (address && address.detailed) {
      const displayText = screens.xs ? address.short : address.detailed;
      const displayTextTrunc = truncateWords(displayText, 3);
      const shortTrunc = truncateWords(address.short, 3);
      const maxWidth = screens.xs ? 120 : (screens.lg ? 200 : 150);

      return (
        <Button
          type="link"
          size="small"
          onClick={handleLocationClick}
          style={{
            padding: '0 4px',
            height: 'auto',
            color: token.colorText,
            maxWidth,
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Space size={4} align="center" style={{ width: '100%' }}>
            <EnvironmentOutlined style={{ color: '#16a34a', fontSize: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.2
                }}
                title={address.full}
              >
                {displayTextTrunc}
              </div>
              {!screens.xs && address.short !== address.detailed && (
                <div
                  style={{
                    fontSize: 11,
                    color: token.colorTextTertiary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2
                  }}
                  title={address.full}
                >
                  {shortTrunc}
                </div>
              )}
            </div>
          </Space>
        </Button>
      );
    }

    return (
      <Button
        type="link"
        size="small"
        onClick={handleLocationClick}
        style={{
          padding: '0 4px',
          height: 'auto',
          color: '#1890ff',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Space size={4} align="center">
          <EnvironmentOutlined />
          <span>Chọn địa điểm</span>
        </Space>
      </Button>
    );
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
          {/* Mobile Layout */}
          {screens.xs ? (
            <Flex justify="space-between" align="center" style={{ width: '100%' }}>
              {/* Left: Menu + Logo */}
              <Flex align="center" gap={8}>
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  size="small"
                  aria-label="Mở menu"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />
                <Link to="/">
                  <Flex align="center" gap={6}>
                    <img
                      src="/logos.png"
                      alt="Logo"
                      style={{ width: 28, height: 28, borderRadius: 4 }}
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/28x28/22c55e/ffffff?text=🍽️")}
                    />
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#16a34a" }}>
                      FoodLive
                    </span>
                  </Flex>
                </Link>
              </Flex>

              {/* Right: Actions */}
              <Flex align="center" gap={4}>
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  size="small"
                  aria-label="Tìm kiếm"
                  onClick={() => navigate('/search')}
                />

                <Badge count={badgeCount} overflowCount={99} size="small">
                  <Button
                    type="text"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleCartClick}
                    aria-label="Giỏ hàng"
                    size="small"
                  />
                </Badge>

                {isLoggedIn ? (
                  <Dropdown
                    menu={{ items: menuItems }}
                    trigger={["click"]}
                    placement="bottomRight"
                  >
                    <Button type="text" size="small">
                      <Avatar size={20} icon={<UserOutlined />} />
                    </Button>
                  </Dropdown>
                ) : (
                  <Button
                    type="primary"
                    icon={<LoginOutlined />}
                    onClick={handleLogin}
                    size="small"
                    style={{
                      backgroundColor: '#16a34a',
                      borderColor: '#16a34a'
                    }}
                  />
                )}
              </Flex>
            </Flex>
          ) : (
            /* Desktop Layout */
            <Row align="middle" justify="space-between" style={{ width: '100%' }} wrap={false}>
              {/* Logo Section */}
              <Col flex="none">
                <Link to="/">
                  <Space size={8} align="center">
                    <img
                      src="/logos.png"
                      alt="Logo"
                      style={{ width: 32, height: 32, borderRadius: 4 }}
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/32x32/22c55e/ffffff?text=🍽️")}
                    />
                    <span style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>
                      FoodLive
                    </span>
                  </Space>
                </Link>
              </Col>

              {/* Location Section */}
              <Col flex="none" style={{ minWidth: 0 }}>
                {renderLocationDisplay()}
              </Col>

              {/* Search Section */}
              <Col flex="auto" style={{ maxWidth: 400, margin: "0 24px", minWidth: 200 }}>
                <SearchBar
                  placeholder="Nhập tên nhà hàng hoặc món ăn..."
                  onSearch={(text) => {
                    if (text?.trim()) {
                      navigate(`/search?q=${encodeURIComponent(text.trim())}`);
                    }
                  }}
                />
              </Col>

              {/* Actions Section */}
              <Col flex="none">
                <Space size={8} align="center">
                  {/* Logged in user actions */}
                  {isLoggedIn && (
                    <>
                      <Button
                        type="text"
                        icon={<OrderedListOutlined />}
                        onClick={() => navigate("/orders")}
                        size="small"
                      >
                        {screens.md ? "Đơn hàng" : ""}
                      </Button>
                      <Button
                        type="text"
                        icon={<MessageOutlined />}
                        size="small"
                      >
                        {screens.md ? "Tin nhắn" : ""}
                      </Button>
                    </>
                  )}

                  {/* Cart Button */}
                  <Badge count={badgeCount} overflowCount={99} size="small">
                    <Button
                      type="text"
                      icon={<ShoppingCartOutlined />}
                      onClick={handleCartClick}
                      aria-label="Giỏ hàng"
                      size="large"
                    />
                  </Badge>

                  {/* User Menu or Login */}
                  {isLoggedIn ? (
                    <Dropdown
                      menu={{ items: menuItems }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <Button type="text" size="large">
                        <Space size={4} align="center">
                          <Avatar size={24} icon={<UserOutlined />} />
                          <span style={{
                            maxWidth: screens.lg ? 120 : 80,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {user?.name}
                          </span>
                          <DownOutlined style={{ fontSize: 12 }} />
                        </Space>
                      </Button>
                    </Dropdown>
                  ) : (
                    <Button
                      type="primary"
                      icon={<LoginOutlined />}
                      onClick={handleLogin}
                      size="large"
                      style={{
                        backgroundColor: '#16a34a',
                        borderColor: '#16a34a'
                      }}
                    >
                      Đăng nhập
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          )}
        </div>
      </Header>

      {/* Mobile Search Bar and Location (shown when mobile menu is open or always visible) */}
      {screens.xs && (
        <div
          style={{
            backgroundColor: '#fff',
            padding: "8px 16px",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 64,
            zIndex: 999
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <SearchBar
              placeholder="Tìm kiếm..."
              size="small"
              onSearch={(text) => {
                if (text?.trim()) {
                  navigate(`/search?q=${encodeURIComponent(text.trim())}`);
                }
              }}
            />
          </div>
          <div>
            {renderLocationDisplay()}
          </div>
        </div>
      )}

      {/* Location Modal */}
      <Modal
        title="Vị trí giao hàng"
        open={showLocationModal}
        onCancel={() => setShowLocationModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowLocationModal(false)}>
            Hủy
          </Button>,
          <Button key="allow" type="primary" onClick={handleLocationPermission}>
            Cho phép truy cập vị trí
          </Button>
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <EnvironmentOutlined style={{ fontSize: 48, color: '#16a34a', marginBottom: 16 }} />
          <p>Để có trải nghiệm tốt nhất, vui lòng cho phép chúng tôi truy cập vị trí của bạn.</p>
          <p style={{ color: token.colorTextSecondary, fontSize: 14 }}>
            Điều này giúp chúng tôi tìm các nhà hàng gần bạn nhất.
          </p>
        </div>
      </Modal>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="FoodLive"
        placement="left"
        onClose={() => setIsMobileMenuOpen(false)}
        open={isMobileMenuOpen}
        width={280}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          style={{ border: 'none' }}
          items={[
            {
              key: '/',
              icon: <HomeOutlined />,
              label: <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>,
            },
            {
              key: '/about',
              icon: <InfoCircleOutlined />,
              label: <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>Giới thiệu</Link>,
            },
            {
              key: '/restaurants',
              icon: <ShopOutlined />,
              label: <Link to="/restaurants" onClick={() => setIsMobileMenuOpen(false)}>Nhà hàng</Link>,
            },
            {
              key: '/faq',
              icon: <QuestionCircleOutlined />,
              label: <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)}>Câu hỏi thường gặp</Link>,
            },
            {
              key: '/news',
              icon: <FileTextOutlined />,
              label: <Link to="/news" onClick={() => setIsMobileMenuOpen(false)}>Tin tức</Link>,
            },
          ]}
        />

        {isLoggedIn && (
          <>
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16 }}>
              <Menu
                mode="vertical"
                style={{ border: 'none' }}
                items={[
                  {
                    key: '/orders',
                    icon: <OrderedListOutlined />,
                    label: <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>Đơn hàng</Link>,
                  },
                  {
                    key: '/profile',
                    icon: <UserOutlined />,
                    label: <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>Hồ sơ</Link>,
                  },
                ]}
              />
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16 }}>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                block
                danger
              >
                Đăng xuất
              </Button>
            </div>
          </>
        )}
      </Drawer>

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
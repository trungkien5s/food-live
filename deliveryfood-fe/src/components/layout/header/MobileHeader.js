import { Link, useNavigate } from "react-router-dom";
import { Button, Badge, Flex, Avatar, Dropdown, theme } from "antd";
import {
  MenuOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import LocationDisplay from "./LocationDisplay";
import SearchBar from "../../common/SearchBar";

export default function MobileHeader({
  isLoggedIn,
  badgeCount,
  onMenuToggle,
  onCartClick,
  onLogin,
  onLogout,
}) {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const userMenuItems = [
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
      onClick: onLogout,
    },
  ];

  return (
    <>
      {/* Main Mobile Header */}
      <Flex justify="space-between" align="center" style={{ width: '100%' }}>
        {/* Left: Menu + Logo */}
        <Flex align="center" gap={8}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            size="small"
            aria-label="Mở menu"
            onClick={onMenuToggle}
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
              onClick={onCartClick}
              aria-label="Giỏ hàng"
              size="small"
            />
          </Badge>

          {isLoggedIn ? (
            <Dropdown
              menu={{ items: userMenuItems }}
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
              onClick={onLogin}
              size="small"
              style={{
                backgroundColor: '#16a34a',
                borderColor: '#16a34a'
              }}
            />
          )}
        </Flex>
      </Flex>

      {/* Mobile Search Bar and Location - Always visible */}
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
          <LocationDisplay />
        </div>
      </div>
    </>
  );
}
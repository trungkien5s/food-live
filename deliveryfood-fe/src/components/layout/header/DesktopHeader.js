import { Link, useNavigate } from "react-router-dom";
import { Row, Col, Space } from "antd";
import LocationDisplay from "./LocationDisplay";
import HeaderActions from "./HeaderActions";
import SearchBar from "../../common/SearchBar";

export default function DesktopHeader({
  isLoggedIn,
  user,
  badgeCount,
  onCartClick,
  onLogin,
  onLogout,
}) {
  const navigate = useNavigate();

  return (
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
        <LocationDisplay />
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
        <HeaderActions
          isLoggedIn={isLoggedIn}
          user={user}
          badgeCount={badgeCount}
          onCartClick={onCartClick}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      </Col>
    </Row>
  );
}
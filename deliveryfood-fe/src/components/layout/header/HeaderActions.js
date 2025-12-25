import { useNavigate } from "react-router-dom";
import { Button, Badge, Space, Grid } from "antd";
import { 
  ShoppingCartOutlined, 
  OrderedListOutlined, 
  MessageOutlined,
  LoginOutlined 
} from "@ant-design/icons";
import UserMenu from "./UserMenu";

const { useBreakpoint } = Grid;

export default function HeaderActions({ 
  isLoggedIn, 
  user, 
  badgeCount, 
  onCartClick, 
  onLogin, 
  onLogout 
}) {
  const navigate = useNavigate();
  const screens = useBreakpoint();

  return (
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
          onClick={onCartClick}
          aria-label="Giỏ hàng"
          size="large"
        />
      </Badge>

      {/* User Menu or Login */}
      {isLoggedIn ? (
        <UserMenu user={user} onLogout={onLogout} />
      ) : (
        <Button
          type="primary"
          icon={<LoginOutlined />}
          onClick={onLogin}
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
  );
}
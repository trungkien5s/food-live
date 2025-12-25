import { Link, useNavigate, useLocation } from "react-router-dom";
import { Drawer, Menu, Button } from "antd";
import {
  HomeOutlined,
  InfoCircleOutlined,
  ShopOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

export default function MobileMenuDrawer({ open, onClose, isLoggedIn, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onClose();
    onLogout();
    navigate('/');
  };

  return (
    <Drawer
      title="FoodLive"
      placement="left"
      onClose={onClose}
      open={open}
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
            label: <Link to="/" onClick={onClose}>Trang chủ</Link>,
          },
          {
            key: '/about',
            icon: <InfoCircleOutlined />,
            label: <Link to="/about" onClick={onClose}>Giới thiệu</Link>,
          },
          {
            key: '/restaurants',
            icon: <ShopOutlined />,
            label: <Link to="/restaurants" onClick={onClose}>Nhà hàng</Link>,
          },
          {
            key: '/faq',
            icon: <QuestionCircleOutlined />,
            label: <Link to="/faq" onClick={onClose}>Câu hỏi thường gặp</Link>,
          },
          {
            key: '/news',
            icon: <FileTextOutlined />,
            label: <Link to="/news" onClick={onClose}>Tin tức</Link>,
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
                  label: <Link to="/orders" onClick={onClose}>Đơn hàng</Link>,
                },
                {
                  key: '/profile',
                  icon: <UserOutlined />,
                  label: <Link to="/profile" onClick={onClose}>Hồ sơ</Link>,
                },
              ]}
            />
          </div>
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16 }}>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogoutClick}
              block
              danger
            >
              Đăng xuất
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
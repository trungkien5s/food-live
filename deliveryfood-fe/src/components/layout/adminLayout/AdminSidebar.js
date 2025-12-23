import { Layout, Menu, Space, Typography } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;
const { Text } = Typography;

const items = [
  {
    key: "/admin/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/admin/users",
    icon: <TeamOutlined />,
    label: "Quản lý tài khoản",
  },
  {
    key: "/admin/orders",
    icon: <ShoppingOutlined />,
    label: "Quản lý đơn hàng",
  },
  {
    key: "/admin/analytics",
    icon: <BarChartOutlined />,
    label: "Thống kê",
  },
  {
    key: "/admin/reports",
    icon: <FileTextOutlined />,
    label: "Báo cáo",
  },
  { type: 'divider' },
  {
    key: "/admin/settings",
    icon: <SettingOutlined />,
    label: "Cài đặt hệ thống",
  },
];

export default function AdminSidebar({ collapsed, onCollapse }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={280}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      }}
      theme="dark"
    >
      {/* Logo Section */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 24px",
          background: "linear-gradient(135deg, #f4f5f6ff 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {collapsed ? (
          <div
            style={{
              width: 36,
              height: 36,
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "white",
            }}
          >
             <img
                                  src="/logos.png"
                                  alt="Logo"
                                  style={{ width: 32, height: 32, borderRadius: 4 }}
                                  onError={(e) => (e.currentTarget.src = "https://placehold.co/32x32/22c55e/ffffff?text=🍽️")}
                                />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            
            <Link to="/admin/dashboard">
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
          </div>
        )}
      </div>

      {/* Menu Section */}
      <div style={{ padding: "16px 8px" }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{
            backgroundColor: "transparent",
            border: "none",
          }}
          inlineIndent={20}
        />
      </div>

      {/* Footer Section */}
      {!collapsed && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            padding: "0 24px",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
          </div>
        </div>
      )}
    </Sider>
  );
}
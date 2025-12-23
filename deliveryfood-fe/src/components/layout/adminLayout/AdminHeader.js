import { Layout, Dropdown, Avatar, Space, Typography, message } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { logout } from "../../../redux/store/slices/userSlice";

const { Header } = Layout;
const { Text } = Typography;

export default function AdminHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const apiBase = process.env.REACT_APP_API_BASE;

  const handleLogout = async () => {
    try {
      await axios.post(`${apiBase}/auth/logout`);
    } catch (err) {
      // có thể log err nếu cần
    }
    dispatch(logout());
    message.success("Đăng xuất thành công");
    navigate("/auth/login");
  };

  const items = [
    {
      key: "profile",
      label: (
        <Space>
          <UserOutlined />
          <Text>Hồ sơ cá nhân</Text>
        </Space>
      ),
    },
    {
      key: "settings",
      label: (
        <Space>
          <SettingOutlined />
          <Text>Cài đặt</Text>
        </Space>
      ),
    },
    { type: "divider" },
    {
      key: "logout",
      label: (
        <Space>
          <LogoutOutlined />
          <Text style={{ color: "#ff4d4f" }}>Đăng xuất</Text>
        </Space>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        background: "#ffffff",
        paddingInline: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e8e8e8",
        boxShadow: "0 1px 4px rgba(0,21,41,.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#001529",
            letterSpacing: "0.5px",
          }}
        >
          Bảng điều khiển
        </Text>
      </div>

      <Space size="large">
        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight" arrow>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.3s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f6f6f6";
              e.currentTarget.style.borderColor = "#d9d9d9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <Avatar
              size={36}
              icon={<UserOutlined />}
              style={{
                boxShadow: "0 2px 8px rgba(24,144,255,0.2)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Text style={{ fontWeight: 500, fontSize: 14 }}>{user?.name || "Admin"}</Text>
              <Text style={{ fontSize: 12, color: "#8c8c8c" }}>Quản trị viên</Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
}

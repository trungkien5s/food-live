import { useNavigate } from "react-router-dom";
import { Dropdown, Button, Space, Avatar, Grid } from "antd";
import { UserOutlined, LogoutOutlined, DownOutlined } from "@ant-design/icons";

const { useBreakpoint } = Grid;

export default function UserMenu({ user, onLogout }) {
  const navigate = useNavigate();
  const screens = useBreakpoint();

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
      onClick: onLogout,
    },
  ];

  return (
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
  );
}
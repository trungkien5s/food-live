// src/components/layout/Navigation.jsx
import { useMemo, useState, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { Menu as AntMenu, Dropdown, Button, Spin, Alert, Typography, Space, ConfigProvider } from "antd";
import { Menu as MenuIcon, ChevronDown } from "lucide-react";

const { Text } = Typography;

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawCategories, setRawCategories] = useState([]);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const apiURL = process.env.REACT_APP_API_BASE;

  const navItems = [
    { name: "Trang chủ", to: "/" },
    { name: "Giới thiệu", to: "/about" },
    { name: "Nhà hàng", to: "/restaurants" },
    { name: "Câu hỏi thường gặp", to: "/faq" },
    { name: "Tin tức", to: "/news" },
    // { name: "Liên hệ", to: "/contact" },
  ];

  const categoryIcons = {
    "Trà sữa": "",
    "Đồ ăn nhanh": "",
    "Cơm": "",
    "Bánh Mì/Xôi": "",
    "Bún/Phở/Mỳ/Cháo": "",
    "Cà phê/Trà": "",
    "Mart": "",
    "Tráng miệng": "",
    "Ăn vặt": "",
  };

  const fetchCategories = useCallback(async () => {
    if (!apiURL) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${apiURL}/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = res?.data?.data || [];
      if (!Array.isArray(data)) throw new Error("Dữ liệu không đúng định dạng");
      setRawCategories(data);
      setLoaded(true);
    } catch (err) {
      setError(`Không tải được danh mục: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiURL]);

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (nextOpen && !loaded && !loading) fetchCategories();
  };

const categories = useMemo(() => {
  if (!Array.isArray(rawCategories) || rawCategories.length === 0) return [];
  return rawCategories.map((category) => ({
    id: category._id || category.id,
    name: category.name || "Chưa đặt tên",
    slug:
      category.slug ||
      category.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") ||
      category._id,
    icon: categoryIcons[category.name],
  }));
}, [rawCategories]);

const goToCategory = (id) => {
  setOpen(false);
  navigate(`/categories/${id}`);
};


  const selectedTopKey = useMemo(() => {
    const path = location.pathname;
    if (path === "/") return "/";
    const matches = navItems
      .filter((i) => i.to !== "/" && path.startsWith(i.to))
      .sort((a, b) => b.to.length - a.to.length);
    return matches[0]?.to || "";
  }, [location.pathname]);

  const topMenuItems = useMemo(
    () =>
      navItems.map((i) => ({
        key: i.to,
        label: (
          <NavLink to={i.to} end={i.to === "/"}>
            {i.name}
          </NavLink>
        ),
      })),
    []
  );

  const categoryMenuItems = useMemo(
    () =>
      categories.map((c) => ({
        key: c.id,
        label: (
          <Space size={8}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{c.icon}</span>
            <Text>{c.name}</Text>
          </Space>
        ),
        onClick: () => goToCategory(c.id),
      })),
    [categories]
  );

  return (
    <div style={{ background: "#fff", borderTop: "1px solid #e5e7eb" }}>
      {/* === Container giống mọi section khác === */}
      <div className="max-w-7xl mx-auto px-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            minHeight: 52,
          }}
        >
          {/* Dropdown danh mục */}
          <Dropdown
            trigger={["hover", "click"]}
            open={open}
            onOpenChange={handleOpenChange}
            placement="bottomLeft"
            arrow
            overlayStyle={{ minWidth: 320 }}
            menu={{ items: categoryMenuItems }}
            dropdownRender={(menu) => (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0" }}>
                  <Text strong>Danh mục món ăn</Text>
                </div>

                {loading && (
                  <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
                    <Spin tip="Đang tải danh mục..." />
                  </div>
                )}

                {!loading && error && (
                  <div style={{ padding: 12 }}>
                    <Alert
                      type="error"
                      showIcon
                      message="Lỗi tải danh mục"
                      description={
                        <Space direction="vertical" size={8}>
                          <span>{error}</span>
                          <Button size="small" onClick={fetchCategories}>
                            Thử lại
                          </Button>
                        </Space>
                      }
                    />
                  </div>
                )}

                {!loading && !error && categories.length === 0 && (
                  <div style={{ padding: 12 }}>
                    <Alert
                      type="info"
                      showIcon
                      message="Chưa có danh mục"
                      description={
                        !loaded ? (
                          <Button size="small" onClick={fetchCategories}>
                            Tải danh mục
                          </Button>
                        ) : (
                          "Hiện chưa có dữ liệu danh mục để hiển thị."
                        )
                      }
                    />
                  </div>
                )}

                {!loading && !error && categories.length > 0 && menu}
              </div>
            )}
          >
            <Button
              type="primary"
              size="middle"
              icon={<MenuIcon size={16} />}
              style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
            >
              Danh mục món ăn <ChevronDown size={14} style={{ marginLeft: 6 }} />
            </Button>
          </Dropdown>

          {/* Top navigation */}
          <ConfigProvider
  theme={{
    components: {
      Menu: {
        itemSelectedColor: '#16a34a',
        itemSelectedBg: 'transparent',
        horizontalItemSelectedColor: '#16a34a',
        itemHoverColor: '#16a34a',
        itemActiveBg: 'transparent',
      }
    }
  }}
>
  <div style={{ flex: 1, minWidth: 0 }}>
    <AntMenu
      mode="horizontal"
      selectedKeys={[selectedTopKey]}
      items={topMenuItems}
    />
  </div>
</ConfigProvider>
        </div>
      </div>
    </div>
  );
}

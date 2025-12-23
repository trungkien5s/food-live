// src/pages/restaurants/RestaurantDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";

// Ant Design
import {
  Breadcrumb,
  Typography,
  Row,
  Col,
  Card,
  Image,
  Button,
  Tag,
  Space,
  Divider,
  Skeleton,
  Alert,
  message,
  Rate,
} from "antd";
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useAppDispatch} from "../../../redux/store/store";
import { addToCartOptimistic } from "../../../redux/store/slices/cartSlice";
import Layout from "../../../components/layout/Layout";
import { setAuthMode, setShowAuthModal } from "../../../redux/store/slices/userSlice";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";

const { Title, Text, Paragraph } = Typography;

/* Safe getter */
const get = (obj, path, fallback = undefined) => {
  try {
    const val = path.split(".").reduce((a, c) => (a == null ? a : a[c]), obj);
    return val == null ? fallback : val;
  } catch {
    return fallback;
  }
};

export default function RestaurantDetailPage() {
  // Support multiple param names
  const params = useParams();
  const restaurantId = params.restaurantId || params.id;
  const focusMenuItemId = params.menuItemId || null;

  const location = useLocation();
  const preloadedItem = location.state?.menuItem || null;

  const [data, setData] = useState(null);
  const [items, setItems] = useState(preloadedItem ? [preloadedItem] : []);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [itemsErr, setItemsErr] = useState(null);

  const base = process.env.REACT_APP_API_BASE || "";

  // 1) Restaurant detail
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await axios.get(`${base}/restaurants/${restaurantId}`);
        const raw = res.data?.data ?? res.data;
        if (mounted) setData(raw);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || e.message || "Không tải được nhà hàng");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [restaurantId]);

  // 2) Menu items for this restaurant
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setItemsLoading(true);
        setItemsErr(null);
        let list = [];
        try {
          const res1 = await axios.get(`${base}/restaurants/${restaurantId}/menu-items`);
          const raw1 = res1.data?.data ?? res1.data;
          if (Array.isArray(raw1) && raw1.length) list = raw1;
        } catch {}
        if (list.length === 0) {
          try {
            const res2 = await axios.get(`${base}/menu-items`, { params: { restaurant: restaurantId } });
            const raw2 = res2.data?.data ?? res2.data ?? [];
            if (Array.isArray(raw2) && raw2.length) list = raw2;
          } catch {}
        }
        if (list.length === 0) {
          const res3 = await axios.get(`${base}/menu-items`);
          const raw3 = res3.data?.data ?? res3.data ?? [];
          list = (Array.isArray(raw3) ? raw3 : []).filter(
            (m) => (get(m, "restaurant._id") || get(m, "restaurant")) === restaurantId
          );
        }
        if (preloadedItem) {
          const has = list.some((x) => (x._id || x.id) === (preloadedItem._id || preloadedItem.id));
          if (!has) list = [preloadedItem, ...list];
        }
        if (mounted) setItems(list);
      } catch (e) {
        if (mounted) setItemsErr(e?.response?.data?.message || e.message || "Không tải được thực đơn");
      } finally {
        if (mounted) setItemsLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  return (
    <Layout>
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton active paragraph={{ rows: 12 }} />
        </div>
      ) : err ? (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Alert type="error" showIcon message={err} />
          <div className="mt-4">
            <Button type="link" icon={<ArrowLeftOutlined />} href="/restaurants">
              Quay lại danh sách
            </Button>
          </div>
        </div>
      ) : data ? (
        <DetailContent
          data={data}
          items={items}
          itemsLoading={itemsLoading}
          itemsErr={itemsErr}
          restaurantId={restaurantId}
          focusMenuItemId={focusMenuItemId}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-6">Không tìm thấy nhà hàng.</div>
      )}
    </Layout>
  );
}

function DetailContent({ data, items, itemsLoading, itemsErr, restaurantId, focusMenuItemId }) {
  const item = useMemo(() => normalizeRestaurant(data), [data]);
  const location = useLocation();
  const shareUrl = typeof window !== "undefined" ? window.location.origin + location.pathname : "";

  const navigate = useNavigate();
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success("Đã sao chép liên kết");
    } catch {
      message.error("Không thể sao chép liên kết");
    }
  };

  // Organize menu items by menu and category
  const organizedItems = useMemo(() => {
    const normalized = (Array.isArray(items) ? items : [])
      .map((m) => {
        const basePrice = get(m, "basePrice");
        const priceCents = get(m, "price_cents");
        let price = Number(get(m, "price", null));
        if (basePrice != null) price = Number(basePrice);
        else if ((price == null || Number.isNaN(price)) && priceCents != null) price = Number(priceCents) / 100;

        return {
          id: get(m, "_id") ?? get(m, "id"),
          name: get(m, "title") ?? get(m, "name", "Món ăn"),
          description: get(m, "description", ""),
          image: get(m, "image") ?? get(m, "imageUrl") ?? get(m, "photo") ?? get(m, "photos.0"),
          price: Number(price ?? 0),
          rating: Number(get(m, "rating") ?? get(m, "avgRating") ?? 0),
          isAvailable: Boolean(get(m, "isAvailable") ?? true),
          restaurantId: get(m, "restaurant._id") ?? get(m, "restaurant"),
          menu: { id: get(m, "menu._id") ?? get(m, "menu.id"), title: get(m, "menu.title") },
          category: { id: get(m, "categoryId._id") ?? get(m, "category._id") ?? get(m, "category.id"), name: get(m, "categoryId.name") ?? get(m, "category.name", "Khác") },
          raw: m,
        };
      })
      .filter((x) => x.restaurantId === (data?._id || data?.id));

    const groupedByMenu = normalized.reduce((acc, item) => {
      const menuKey = item.menu.id || "default";
      if (!acc[menuKey]) acc[menuKey] = { menu: item.menu, categories: {} };
      const categoryKey = item.category.id || "uncategorized";
      if (!acc[menuKey].categories[categoryKey]) acc[menuKey].categories[categoryKey] = { category: item.category, items: [] };
      acc[menuKey].categories[categoryKey].items.push(item);
      return acc;
    }, {});

    return groupedByMenu;
  }, [items, data]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cover */}
      <div className="relative h-56 sm:h-72 md:h-80 bg-gray-100 overflow-hidden">
  {item.image ? (
    <div className="absolute inset-0">
      <Image
        src={item.image}
        alt={`Ảnh ${item.name}`}
        preview={false}
        // ép wrapper của AntD Image full khung
        wrapperStyle={{ width: "100%", height: "100%" }}
        // ép chính thẻ <img> full khung và cover
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-400">
      Không có ảnh
    </div>
  )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div>
            <Tag color={item.isOpen ? "green" : "red"} icon={<ShopOutlined />} style={{ backdropFilter: "blur(4px)" }}>
              {item.isOpen ? "Đang mở" : "Đóng cửa"}
            </Tag>
            <Title level={2} style={{ color: "#fff", margin: "6px 0 0" }}>{item.name}</Title>
            <Space size={8}>
              <StarFilled style={{ color: "#f59e0b" }} />
              <Text style={{ color: "#fff" }}>{item.rating > 0 ? `${item.rating.toFixed(1)} / 5` : "Chưa có đánh giá"}</Text>
            </Space>
          </div>
          <Button icon={<ShareAltOutlined />} onClick={onShare}>Chia sẻ</Button>
        </div>
      </div>

      {/* Breadcrumb + Back */}
      <div className="px-4 pt-4">
        <Breadcrumb
          items={[
            { title: <Link to="/">Trang chủ</Link> },
            { title: <Link to="/restaurants">Nhà hàng</Link> },
            { title: item.name },
          ]}
        />
        <Button
      type="primary"
      icon={<ArrowLeftOutlined />}
      onClick={() => navigate(-1)} // quay lại trang trước
      
    >
      Quay lại
    </Button>
      </div>

      {/* Main */}
      <div className="px-4 py-6">
        <Row gutter={[24, 24]}>
          {/* Left */}
          <Col xs={24} lg={16}>
            <Card bordered={true} style={{ marginBottom: 16 }}>
              <Title level={4}>Giới thiệu</Title>
              <Paragraph>{item.description || "Nhà hàng hiện chưa có mô tả chi tiết."}</Paragraph>
            </Card>

            <Card bordered={true}>
              <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                <Title level={4} style={{ margin: 0 }}>Thực đơn tại {item.name}</Title>
                {itemsLoading && <Text type="secondary">Đang tải món…</Text>}
              </Space>
              <Divider style={{ margin: "12px 0 16px" }} />

              {itemsErr ? (
                <Alert type="error" showIcon message={itemsErr} />
              ) : Object.keys(organizedItems).length === 0 ? (
                <Text type="secondary">Chưa có món nào.</Text>
              ) : (
                <Space direction="vertical" size={32} style={{ width: "100%" }}>
                  {Object.entries(organizedItems).map(([menuKey, menuData]) => (
                    <div key={menuKey}>
                      <Title level={5} style={{ marginBottom: 8 }}>{menuData.menu.title}</Title>
                      <Divider style={{ margin: "8px 0 16px" }} />

                      {Object.entries(menuData.categories).map(([categoryKey, categoryData]) => (
                        <div key={categoryKey} style={{ marginBottom: 24 }}>
                          {categoryData.category.name !== "Khác" && (
                            <Space align="center" style={{ marginBottom: 12 }}>
                              <Tag>{categoryData.category.name}</Tag>
                            </Space>
                          )}

                          <Row gutter={[16, 16]}>
                            {categoryData.items.map((m) => (
                              <Col key={m.id} xs={24} sm={12}>
                                <MenuItemCard
                                  m={m}
                                  restaurantId={restaurantId}
                                  highlight={focusMenuItemId && String(focusMenuItemId) === String(m.id)}
                                />
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))}
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Col>

          {/* Right */}
          <Col xs={24} lg={8}>
            <InfoCard item={item} />
          </Col>
        </Row>
      </div>
    </div>
  );
}

function MenuItemCard({ m, restaurantId, highlight }) {
  const nf = useMemo(() => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }), []);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoggedIn } = useAppSelector((s) => s.user);

  const onAdd = async (e) => {
    e.stopPropagation();
    try {
      await dispatch(addToCartOptimistic({ menu: m, quantity: 1 }));
    } catch (e2) {
      console.error(e2);
    }
    if (!isLoggedIn) {
          dispatch(setAuthMode("login"));
          dispatch(setShowAuthModal(true));
          return;
        }
  };

  return (
    <Card
      hoverable
      onClick={() => navigate(`/restaurants/${restaurantId}`, { state: { menuItem: m } })}
      cover={
        m.image ? (
          <Image src={m.image} alt={m.name} height={160} style={{ objectFit: "cover" }} preview={false} />
        ) : (
          <div style={{ height: 160, background: "#f2f3f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>Không có ảnh</div>
        )
      }
      style={highlight ? { borderColor: "#10b981", boxShadow: "0 0 0 2px rgba(16,185,129,0.3)" } : undefined}
    >
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong ellipsis={{ tooltip: m.name }}>{m.name}</Text>
          {m.rating > 0 && (
            <Space size={4}>
              <StarFilled style={{ color: "#f59e0b" }} />
              <Text type="secondary">{m.rating.toFixed(1)}</Text>
            </Space>
          )}
        </Space>

        {m.description && (
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: m.description }}>
            {m.description}
          </Text>
        )}

        {m.category?.name && m.category.name !== "Khác" && (
          <Tag>{m.category.name}</Tag>
        )}

        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong style={{ color: "#047857" }}>{nf.format(m.price || 0)}</Text>
          <Button
            type="default"
            icon={<ShoppingCartOutlined />}
            onClick={onAdd}
            disabled={!m.isAvailable}
          >
            {m.isAvailable ? "Thêm" : "Tạm hết"}
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

function InfoCard({ item }) {
  const openMaps = () => {
    const q = encodeURIComponent(item.address || item.name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };
  const callNow = () => { if (item.phone) window.location.href = `tel:${item.phone}`; };
  const mailNow = () => { if (item.email) window.location.href = `mailto:${item.email}`; };

  return (
    <Card title="Thông tin liên hệ" bordered={true}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <InfoRow icon={<EnvironmentOutlined style={{ color: "#16a34a" }} />} label="Địa chỉ" value={item.address || "Chưa cập nhật"} />
        <Button onClick={openMaps} icon={<EnvironmentOutlined />}>
          Chỉ đường
        </Button>
        <Divider style={{ margin: "8px 0" }} />

        <InfoRow icon={<PhoneOutlined style={{ color: "#16a34a" }} />} label="Điện thoại" value={item.phone || "Chưa cập nhật"} />
        <Button onClick={callNow} disabled={!item.phone} type="primary">
          Gọi ngay
        </Button>
        <Divider style={{ margin: "8px 0" }} />

        <InfoRow icon={<MailOutlined style={{ color: "#16a34a" }} />} label="Email" value={item.email || "Chưa cập nhật"} />
        <Button onClick={mailNow} disabled={!item.email}>
          Gửi email
        </Button>
        <Divider style={{ margin: "8px 0" }} />

        <Space>
          <ClockCircleOutlined />
          <Text>Giờ mở cửa: {item.isOpen ? "Hiện đang mở" : "Hiện đã đóng"}</Text>
        </Space>
      </Space>
    </Card>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
      <div style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "flex-start" }}>
        {icon}
        <Text>{value}</Text>
      </div>
    </div>
  );
}

function normalizeRestaurant(raw) {
  return {
    id: raw?._id || raw?.id,
    name: raw?.name || "—",
    description: raw?.description,
    phone: raw?.phone,
    email: raw?.email,
    address: raw?.address,
    image: raw?.image || raw?.imageUrl || raw?.cover,
    rating: Number(raw?.rating ?? raw?.avgRating ?? 0),
    isOpen: Boolean(raw?.isOpen ?? raw?.open ?? true),
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
}

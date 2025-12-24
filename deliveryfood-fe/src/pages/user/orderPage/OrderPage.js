// src/pages/OrderPage.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../redux/store/store";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";
import { fetchMyOrders } from "../../../redux/store/slices/ordersSlice";
import Layout from "../../../components/layout/Layout";

/* Icons */
import {
  Store as StoreIcon,
  Clock as ClockIcon,
  MapPin,
  Phone,
  User as UserIcon,
  Star,
  Truck,
  CheckCircle,
  XCircle,
  ChevronRight,
  Package,
} from "lucide-react";

/* Ant Design */
import {
  ConfigProvider,
  Typography,
  Row,
  Col,
  Card,
  Tag,
  Steps,
  Button,
  Badge,
  Divider,
  Skeleton,
  Alert,
  Empty,
  Drawer,
  Avatar,
  List,
  Descriptions,
  Space,
  Timeline,
} from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

/* ========================= Helpers ========================= */
const imgSrc = (img) => (typeof img === "string" ? img : img?.url || img?.secure_url || null);
const fmt = (v) => Number(v || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const ftime = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
const getId = (o) => o?._id || o?.id || "";

/* ========================= Status UI ========================= */
const STATUS_MAP = {
  PENDING: { label: "Chờ xác nhận", color: "#f59e0b", bgColor: "#fef3c7", icon: <ClockIcon size={14} /> },
  CONFIRMED: { label: "Đã xác nhận", color: "#3b82f6", bgColor: "#dbeafe", icon: <CheckCircle size={14} /> },
  DELIVERING: { label: "Đang giao", color: "#10b981", bgColor: "#d1fae5", icon: <Truck size={14} /> },
  COMPLETED: { label: "Hoàn thành", color: "#6b7280", bgColor: "#f3f4f6", icon: <CheckCircle size={14} /> },
  CANCELED: { label: "Đã hủy", color: "#ef4444", bgColor: "#fee2e2", icon: <XCircle size={14} /> },
};

const StatusTag = ({ status }) => {
  const st = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <Tag
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: "none",
        background: st.bgColor,
        color: st.color,
        fontWeight: 600,
        padding: "4px 12px",
        borderRadius: 20,
      }}
    >
      {st.icon}
      {st.label}
    </Tag>
  );
};


/* ========================= Order Card ========================= */
const OrderCard = ({ order, index }) => {
  const [openMap, setOpenMap] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  const items = useMemo(() => {
    const details = order?.orderDetails || order?.items || order?.orderItems || [];
    return Array.isArray(details)
      ? details.map((d) => ({
          id: d._id || d.id,
          quantity: d.quantity ?? d.qty ?? 1,
          price: d.price ?? d.unitPrice ?? (d.menuItem && d.menuItem.price) ?? 0,
          menuItem: d.menuItem || {},
          raw: d,
        }))
      : [];
  }, [order]);

  const computedSubtotal = useMemo(() => {
    if (!items || items.length === 0) return order?.fees?.subtotal ?? undefined;
    return items.reduce((s, it) => s + (Number(it.price) || 0) * Number(it.quantity || 1), 0);
  }, [items, order]);

  const orderId = getId(order);
  const canTrack = order?.status === "DELIVERING";
  const delivery = order?.deliveryAddress || {};
  const fees = order?.fees || {};
  const timing = order?.timing || {};

  return (
    <>
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
        }}
        styles={{ body: { padding: 0 } }}
        hoverable
      >
        {/* Header Section */}
        <div style={{ padding: "16px 20px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar
                shape="square"
                size={48}
                src={imgSrc(order?.restaurant?.image) || undefined}
                style={{ borderRadius: 12 }}
                icon={<StoreIcon />}
              />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {order?.restaurant?.name || "Nhà hàng"}
                </Text>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{(orderId || "").toString().slice(-6)}
                  </Text>
                  <span style={{ color: "#d1d5db" }}>•</span>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {ftime(timing?.orderTime || order?.createdAt)}
                  </Text>
                </div>
              </div>
            </div>
            <StatusTag status={order?.status} />
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              {["Chờ xác nhận", "Xác nhận", "Đang giao", order?.status === "CANCELED" ? "Đã hủy" : "Hoàn thành"].map(
                (label, idx) => {
                  const currentStep =
                    order?.status === "PENDING"
                      ? 0
                      : order?.status === "CONFIRMED"
                      ? 1
                      : order?.status === "DELIVERING"
                      ? 2
                      : 3;
                  const isActive = idx <= currentStep;
                  return (
                    <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isActive ? "#16a34a" : "#94a3b8",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {label}
                      </Text>
                    </div>
                  );
                }
              )}
            </div>
            <div style={{ display: "flex", gap: 4, height: 4, borderRadius: 4, overflow: "hidden", background: "#e5e7eb" }}>
              {[0, 1, 2, 3].map((idx) => {
                const currentStep =
                  order?.status === "PENDING"
                    ? 0
                    : order?.status === "CONFIRMED"
                    ? 1
                    : order?.status === "DELIVERING"
                    ? 2
                    : 3;
                const isActive = idx <= currentStep;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      background: isActive ? "#16a34a" : "#e5e7eb",
                      transition: "all 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 14 }}>
              Món đã đặt ({items.length})
            </Text>
          </div>
          <div style={{ background: "#fafafa", borderRadius: 12, padding: 12 }}>
            {(items.length > 0 ? items : []).slice(0, expanded ? undefined : 2).map((item, idx) => {
              const qty = Number(item?.quantity ?? 1);
              const menu = item?.menuItem || {};
              const title = menu?.title || menu?.name || `Món ${idx + 1}`;
              const image = imgSrc(menu?.image) || "https://placehold.co/64x64?text=🍽️";
              const unit = Number(item?.price ?? 0) || 0;
              const linePrice = unit * qty;
              return (
                <div
                  key={item?.id || item?.raw?._id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: idx < (expanded ? items.length : Math.min(2, items.length)) - 1 ? "1px solid #f0f0f0" : "none",
                  }}
                >
                  <div className="flex items-center gap-3" style={{ flex: 1 }}>
                    <Avatar shape="square" src={image} size={48} style={{ borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14 }}>{title}</Text>
                      <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>x{qty}</div>
                    </div>
                  </div>
                  <Text strong style={{ fontSize: 14 }}>
                    {fmt(linePrice)}
                  </Text>
                </div>
              );
            })}
            {items && items.length > 2 && (
              <Button
                type="text"
                onClick={() => setExpanded((v) => !v)}
                style={{ marginTop: 8, padding: 0, height: "auto", color: "#16a34a", fontWeight: 500 }}
                block
              >
                {expanded ? "Thu gọn" : `Xem thêm ${items.length - 2} món`}
                <ChevronRight
                  size={16}
                  style={{ marginLeft: 4, transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
                />
              </Button>
            )}
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Summary Section */}
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="flex justify-between">
              <Text type="secondary" style={{ fontSize: 13 }}>
                Tạm tính
              </Text>
              <Text style={{ fontSize: 13 }}>{fmt(computedSubtotal ?? fees?.subtotal ?? 0)}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary" style={{ fontSize: 13 }}>
                Phí giao hàng
              </Text>
              <Text style={{ fontSize: 13 }}>{fmt(fees?.deliveryFee ?? fees?.shippingFee ?? 0)}</Text>
            </div>
            {((fees?.tax ?? 0) + (fees?.serviceFee ?? 0) > 0) && (
              <div className="flex justify-between">
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Thuế & Phí dịch vụ
                </Text>
                <Text style={{ fontSize: 13 }}>{fmt((fees?.tax ?? 0) + (fees?.serviceFee ?? 0))}</Text>
              </div>
            )}
            {(fees?.discount ?? 0) > 0 && (
              <div className="flex justify-between">
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Giảm giá
                </Text>
                <Text style={{ fontSize: 13, color: "#16a34a" }}>-{fmt(fees?.discount ?? 0)}</Text>
              </div>
            )}
            <Divider style={{ margin: "8px 0" }} />
            <div className="flex justify-between items-center">
              <Text strong style={{ fontSize: 15 }}>
                Tổng cộng
              </Text>
              <Text strong style={{ fontSize: 18, color: "#16a34a" }}>
                {fmt(fees?.totalAmount ?? order?.totalPrice ?? 0)}
              </Text>
            </div>
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* Footer Actions */}
        <div style={{ padding: "12px 20px", background: "#fafafa", display: "flex", gap: 8 }}>
          {canTrack ? (
            <Button
              type="primary"
              block
              onClick={() => setOpenMap(true)}
              icon={<MapPin size={16} />}
              style={{ height: 40, borderRadius: 10, background: "#16a34a", fontWeight: 500 }}
            >
              Theo dõi đơn hàng
            </Button>
          ) : (
            <>
              <Button
                block
                onClick={() => setOpenDetail(true)}
                style={{ height: 40, borderRadius: 10, fontWeight: 500 }}
              >
                Xem chi tiết
              </Button>
              {order?.status === "COMPLETED" && (
                <Button
                  type="primary"
                  block
                  icon={<Star size={16} />}
                  style={{ height: 40, borderRadius: 10, background: "#f59e0b", fontWeight: 500 }}
                >
                  Đánh giá
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* <DeliveryMapDrawer open={openMap} onClose={() => setOpenMap(false)} /> */}

      {/* Detail Drawer */}
      <Drawer
        title={
          <div>
            <Text strong style={{ fontSize: 16 }}>
              Chi tiết đơn hàng
            </Text>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              #{(orderId || "").toString().slice(-8)}
            </div>
          </div>
        }
        width={720}
        open={openDetail}
        onClose={() => setOpenDetail(false)}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Card size="small" bordered={false} style={{ background: "#fafafa" }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Trạng thái
                </Text>
                <div style={{ marginTop: 4 }}>
                  <StatusTag status={order?.status} />
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Thanh toán
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Tag style={{ borderRadius: 6 }}>
                    {order?.paymentMethod} • {order?.paymentStatus}
                  </Tag>
                </div>
              </div>
            </Space>
          </Card>

          <Card title="Nhà hàng" size="small" bordered={false} style={{ background: "#fafafa" }}>
            <div className="flex items-center gap-3">
              <Avatar
                shape="square"
                size={56}
                src={imgSrc(order?.restaurant?.image) || undefined}
                style={{ borderRadius: 12 }}
              />
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 15 }}>
                  {order?.restaurant?.name}
                </Text>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                  {order?.restaurant?.address}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Địa chỉ giao hàng" size="small" bordered={false} style={{ background: "#fafafa" }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div>
                <Text strong>{delivery?.recipientName || "—"}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {delivery?.recipientPhone || "—"}
                </Text>
              </div>
              <Text style={{ fontSize: 14, color: "#374151" }}>{delivery?.fullAddress || delivery?.street || "—"}</Text>
            </Space>
          </Card>

          <Card title="Chi tiết món ăn" size="small" bordered={false} style={{ background: "#fafafa" }}>
            <List
              dataSource={items}
              renderItem={(it) => {
                const menu = it.menuItem || {};
                return (
                  <List.Item
                    key={it.id || it.raw?._id}
                    style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar shape="square" src={imgSrc(menu.image) || undefined} size={56} />}
                      title={<Text style={{ fontSize: 14 }}>{menu.title || menu.name || "Món"}</Text>}
                      description={
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          SL: {it.quantity} × {fmt(it.price)}
                        </Text>
                      }
                    />
                    <Text strong style={{ fontSize: 14 }}>
                      {fmt((it.price || 0) * (it.quantity || 1))}
                    </Text>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Space>
      </Drawer>
    </>
  );
};

/* ========================= Empty State ========================= */
const EmptyState = () => (
  <div style={{ textAlign: "center", padding: "80px 20px" }}>
    <div
      style={{
        width: 120,
        height: 120,
        margin: "0 auto 24px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Package size={56} color="#16a34a" strokeWidth={1.5} />
    </div>
    <Title level={3} style={{ marginBottom: 8 }}>
      Chưa có đơn hàng
    </Title>
    <Text type="secondary" style={{ fontSize: 15, display: "block", marginBottom: 24 }}>
      Khám phá món ngon và đặt hàng ngay!
    </Text>
    <Link to="/restaurants">
      <Button type="primary" size="large" style={{ height: 48, padding: "0 32px", borderRadius: 12, fontSize: 15 }}>
        Khám phá nhà hàng
      </Button>
    </Link>
  </div>
);

/* ========================= Main Page ========================= */
export default function OrderPage() {
  const dispatch = useAppDispatch();
  const { myOrders, loading, error } = useAppSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4 py-6">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#16a34a",
              borderRadius: 12,
              colorBgContainer: "#ffffff",
            },
            components: {
              Card: { borderRadiusLG: 16 },
              Button: { borderRadius: 10 },
              Tag: { borderRadiusSM: 20 },
            },
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <Title level={2} style={{ margin: 0, fontSize: 28 }}>
                Đơn hàng của tôi
              </Title>
              <Text type="secondary" style={{ fontSize: 15 }}>
                Theo dõi và quản lý các đơn hàng của bạn
              </Text>
            </div>

            {error && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16, borderRadius: 12 }}
                message="Có lỗi xảy ra"
                description={String(error)}
              />
            )}

            {loading ? (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {[1, 2, 3].map((k) => (
                  <Card key={k} bordered={false} style={{ borderRadius: 16 }}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                ))}
              </Space>
            ) : !myOrders?.length ? (
              <EmptyState />
            ) : (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {myOrders.map((order, idx) => (
                  <OrderCard key={getId(order) || idx} order={order} index={idx} />
                ))}
              </Space>
            )}
          </div>
        </ConfigProvider>
      </section>
    </Layout>
  );
}
// src/pages/OrderPage.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../redux/store/store";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";
import { fetchMyOrders } from "../../../redux/store/slices/ordersSlice";
import Layout from "../../../components/layout/Layout";

/* Icons */
import {
  RefreshCw,
  Store as StoreIcon,
  Clock as ClockIcon,
  MapPin,
  Phone,
  User as UserIcon,
  Star,
  Truck,
  CheckCircle,
  XCircle,
  MoreHorizontal,
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
  Statistic,
  Descriptions,
  Space,
} from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { Countdown } = Statistic;

/* ========================= Helpers ========================= */
const imgSrc = (img) => (typeof img === "string" ? img : img?.url || img?.secure_url || null);
const fmt = (v) => Number(v || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const ftime = (s) => (s ? new Date(s).toLocaleString("vi-VN") : "—");
const getId = (o) => o?._id || o?.id || "";

/* ========================= Status UI ========================= */
const STATUS_MAP = {
  PENDING: { label: "Chờ xác nhận", color: "orange", icon: <ClockIcon size={14} /> },
  CONFIRMED: { label: "Đã xác nhận", color: "blue", icon: <CheckCircle size={14} /> },
  DELIVERING: { label: "Đang giao", color: "green", icon: <Truck size={14} /> },
  COMPLETED: { label: "Hoàn thành", color: "default", icon: <CheckCircle size={14} /> },
  CANCELED: { label: "Đã hủy", color: "red", icon: <XCircle size={14} /> },
};

const statusToStep = (s) => {
  switch (s) {
    case "PENDING":
      return 0;
    case "CONFIRMED":
      return 1;
    case "DELIVERING":
      return 2;
    case "COMPLETED":
    case "CANCELED":
      return 3;
    default:
      return 0;
  }
};

const StatusTag = ({ status }) => {
  const st = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <Tag color={st.color} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {st.icon}
      {st.label}
    </Tag>
  );
};

/* ========================= Fake Map (Drawer) ========================= */
const DeliveryMapDrawer = ({ open, onClose, shipperName = "Nguyễn Văn A" }) => {
  const [shipperLocation, setShipperLocation] = useState({
    lat: 10.7769,
    lng: 106.7009,
    address: "Đang di chuyển...",
  });

  useEffect(() => {
    if (!open) return;
    const locations = [
      { lat: 10.7769, lng: 106.7009, address: "Đang lấy hàng tại nhà hàng" },
      { lat: 10.778, lng: 106.702, address: "Đã lấy hàng, đang di chuyển" },
      { lat: 10.779, lng: 106.703, address: "Đang trên đường giao hàng" },
      { lat: 10.7751, lng: 106.7074, address: "Sắp đến địa chỉ giao hàng" },
    ];
    let i = 0;
    const it = setInterval(() => {
      i = Math.min(i + 1, locations.length - 1);
      setShipperLocation(locations[i]);
    }, 3000);
    return () => clearInterval(it);
  }, [open]);

  return (
    <Drawer
      title="Theo dõi đơn hàng"
      placement="bottom"
      height="66%"
      open={open}
      onClose={onClose}
      bodyStyle={{ paddingTop: 0 }}
    >
      <Card
        bordered
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
        cover={
          <div className="w-full h-64 bg-gradient-to-br from-green-100 via-blue-50 to-orange-100 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/4 w-1/2 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-orange-400 -translate-y-1/2 rounded-full" />
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
              <Badge count="Nhà hàng" color="orange">
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shadow">
                  <StoreIcon size={16} color="#fff" />
                </div>
              </Badge>
            </div>
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
              style={{ left: `${25 + (shipperLocation.lat - 10.7769) * 10000}%` }}
            >
              <Badge count="Shipper" color="blue">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow">
                  <Truck size={16} color="#fff" />
                </div>
              </Badge>
            </div>
            <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2">
              <Badge count="Điểm giao" color="red">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow">
                  <MapPin size={16} color="#fff" />
                </div>
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <Card size="small" style={{ backdropFilter: "blur(4px)" }}>
                <Space direction="vertical" size={2}>
                  <Space align="center">
                    <Badge status="processing" />
                    <Text strong>{shipperLocation.address}</Text>
                  </Space>
                  <Text type="secondary">Cập nhật: {new Date().toLocaleTimeString("vi-VN")}</Text>
                </Space>
              </Card>
            </div>
          </div>
        }
      />
      <Card>
        <Space align="center" className="w-full" style={{ justifyContent: "space-between" }}>
          <Space align="center">
            <Avatar size={48} style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }} icon={<UserIcon />} />
            <div>
              <Text strong>{shipperName}</Text>
              <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 12 }}>
                <span>Shipper</span>
                <span>•</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Star size={12} /> 4.8
                </span>
                <span>•</span>
                <span>09xx xxx xxx</span>
              </div>
            </div>
          </Space>
          <Button icon={<Phone size={16} />} type="default">
            Gọi
          </Button>
        </Space>

        <Divider />

        <Steps
          direction="vertical"
          items={[
            { title: "Đã lấy hàng", description: "14:30", icon: <CheckCircle /> },
            { title: "Đang giao hàng", description: "Hiện tại", icon: <Truck /> },
            { title: "Giao thành công", description: "Dự kiến 15:15", icon: <MapPin /> },
          ]}
          current={1}
        />
      </Card>
    </Drawer>
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

  const stepsCurrent = statusToStep(order?.status);
  const coverUrl = imgSrc(order?.restaurant?.image) || "https://placehold.co/600x300?text=Restaurant";
  const canTrack = order?.status === "DELIVERING";
  const orderId = getId(order);

  const delivery = order?.deliveryAddress || {};
  const fees = order?.fees || {};
  const timing = order?.timing || {};

  return (
    <>
      <Card
        hoverable
        style={{ borderRadius: 16, overflow: "hidden", animationDelay: `${index * 60}ms` }}
        actions={[
          canTrack ? (
            <Button key="track" type="primary" onClick={() => setOpenMap(true)} icon={<MapPin size={16} />}>
              Xem bản đồ
            </Button>
          ) : (
            <Button key="more" icon={<MoreHorizontal size={16} />} onClick={() => setOpenDetail(true)}>
              Chi tiết
            </Button>
          ),
        ]}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                <Space align="center">
                  <Avatar
                    shape="square"
                    size={48}
                    src={imgSrc(order?.restaurant?.image) || undefined}
                    alt="logo"
                    style={{ borderRadius: 8 }}
                  >
                    <StoreIcon />
                  </Avatar>
                  <div>
                    <Text strong>{order?.restaurant?.name || "Nhà hàng"}</Text>
                    <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 12 }}>
                      <ClockIcon size={14} />
                      <span>{ftime(timing?.orderTime || order?.createdAt)}</span>
                      <span>•</span>
                      <span>#{(orderId || "").toString().slice(-6)}</span>
                      <span>•</span>
                      <StatusTag status={order?.status} />
                    </div>
                    {order?.restaurant?.address && (
                      <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                        <MapPin size={12} /> {order.restaurant.address}
                      </div>
                    )}
                  </div>
                </Space>

                <div style={{ textAlign: "right" }}>
                  <Text type="secondary" style={{ display: "block" }}>
                    Trạng thái thanh toán
                  </Text>
                  <div style={{ marginTop: 6 }}>
                    <Tag color={order?.paymentStatus === "PAID" ? "green" : "orange"}>
                      {order?.paymentMethod ?? "—"} • {order?.paymentStatus ?? "—"}
                    </Tag>
                  </div>
                </div>
              </Space>

              <Steps
                current={stepsCurrent}
                items={[
                  { title: "Chờ xác nhận" },
                  { title: "Đã xác nhận" },
                  { title: "Đang giao" },
                  { title: order?.status === "CANCELED" ? "Đã hủy" : "Hoàn thành" },
                ]}
                responsive
              />

              <Card size="small" bordered>
                <List
                  dataSource={(items && items.length > 0 ? items : []).slice(0, expanded ? undefined : 2)}
                  renderItem={(item, idx) => {
                    const qty = Number(item?.quantity ?? 1);
                    const menu = item?.menuItem || {};
                    const title = menu?.title || menu?.name || `Món ${idx + 1}`;
                    const image = imgSrc(menu?.image) || "https://placehold.co/64x64?text=🍽️";
                    const unit = Number(item?.price ?? 0) || 0;
                    const linePrice = unit * qty;
                    return (
                      <List.Item key={item?.id || item?.raw?._id || idx} extra={<Text strong>{fmt(linePrice)}</Text>}>
                        <List.Item.Meta
                          avatar={<Avatar shape="square" src={image} />}
                          title={<Text>{title}</Text>}
                          description={<Text type="secondary">SL: {qty}</Text>}
                        />
                      </List.Item>
                    );
                  }}
                  locale={{
                    emptyText: (
                      <Text type="secondary" italic>
                        Chưa có chi tiết món
                      </Text>
                    ),
                  }}
                />
                {items && items.length > 2 && (
                  <Button type="link" onClick={() => setExpanded((v) => !v)} style={{ paddingLeft: 0 }}>
                    {expanded ? "Thu gọn" : `Xem thêm ${items.length - 2} món`}
                  </Button>
                )}
              </Card>

              <Card size="small" style={{ marginTop: 8 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>Địa chỉ giao hàng</Text>
                  <div style={{ color: "#374151" }}>
                    <div>
                      <Text strong>{delivery?.recipientName || "—"}</Text> •{" "}
                      <Text type="secondary">{delivery?.recipientPhone || "—"}</Text>
                    </div>
                    <div style={{ marginTop: 4 }}>{delivery?.fullAddress || delivery?.street || "—"}</div>
                  </div>
                </Space>
              </Card>
            </Space>
          </Col>

          <Col xs={24} md={10}>
            <Card size="small" bordered>
              <Descriptions size="small" column={1} colon={false}>
                <Descriptions.Item label="Tạm tính">
                  <Text strong>{fmt(computedSubtotal ?? fees?.subtotal ?? 0)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phí giao">
                  <Text strong>{fmt(fees?.deliveryFee ?? fees?.shippingFee ?? 0)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thuế / Phí dịch vụ">
                  <Text strong>{fmt((fees?.tax ?? 0) + (fees?.serviceFee ?? 0))}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Giảm giá">
                  <Text strong>{fmt(fees?.discount ?? 0)}</Text>
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: "8px 0" }} />

              <Space align="baseline" style={{ justifyContent: "space-between", width: "100%" }}>
                <Text strong style={{ fontSize: 16 }}>
                  Tổng cộng
                </Text>
                <Title level={4} style={{ margin: 0, color: "#16a34a" }}>
                  {fmt(fees?.totalAmount ?? order?.totalPrice ?? 0)}
                </Title>
              </Space>

              {timing?.estimatedDeliveryTime && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                    Dự kiến giao:
                  </Text>
                  <Countdown
                    value={new Date(timing.estimatedDeliveryTime).getTime()}
                    format="HH:mm:ss"
                    valueStyle={{ fontSize: 16 }}
                  />
                </div>
              )}

              <Divider />

              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text type="secondary">Thời gian đặt:</Text>
                <Text>{ftime(timing?.orderTime || order?.createdAt)}</Text>

                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  {/* <Button block onClick={() => setOpenDetail(true)}>
                    Xem chi tiết
                  </Button> */}
                  {order?.status === "COMPLETED" && <Button type="primary">Đánh giá</Button>}
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <DeliveryMapDrawer open={openMap} onClose={() => setOpenMap(false)} />

      <Drawer
        title={`Chi tiết đơn #${(orderId || "").toString().slice(-8)}`}
        width={720}
        open={openDetail}
        onClose={() => setOpenDetail(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Mã đơn">{orderId}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <StatusTag status={order?.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Thanh toán">
            {order?.paymentMethod} • {order?.paymentStatus}
          </Descriptions.Item>
          <Descriptions.Item label="Nhà hàng">
            <div>
              <Text strong>{order?.restaurant?.name}</Text>
              <div style={{ color: "#6b7280" }}>{order?.restaurant?.address}</div>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ giao">{delivery?.fullAddress || delivery?.street}</Descriptions.Item>
          <Descriptions.Item label="Người nhận">
            {delivery?.recipientName} • {delivery?.recipientPhone}
          </Descriptions.Item>
          <Descriptions.Item label="Phí">
            <div>
              <div>Tạm tính: {fmt(fees?.subtotal ?? 0)}</div>
              <div>Phí giao: {fmt(fees?.deliveryFee ?? 0)}</div>
              <div>Thuế: {fmt(fees?.tax ?? 0)}</div>
              <div>Giảm giá: {fmt(fees?.discount ?? 0)}</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>Tổng: {fmt(fees?.totalAmount ?? 0)}</div>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Danh sách món">
            <List
              dataSource={items}
              renderItem={(it) => {
                const menu = it.menuItem || {};
                return (
                  <List.Item key={it.id || it.raw?._id}>
                    <List.Item.Meta
                      avatar={<Avatar shape="square" src={imgSrc(menu.image) || undefined} />}
                      title={`${menu.title || menu.name || "Món"}`}
                      description={`SL: ${it.quantity} — ${fmt(it.price)}`}
                    />
                    <div>{fmt((it.price || 0) * (it.quantity || 1))}</div>
                  </List.Item>
                );
              }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Drawer>
    </>
  );
};

/* ========================= Empty ========================= */
const EmptyState = () => (
  <Card bordered style={{ textAlign: "center" }}>
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Avatar
        size={96}
        shape="square"
        style={{ background: "#f2f4f7", color: "#94a3b8" }}
        icon={<StoreIcon size={40} />}
      />
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>
          Chưa có đơn hàng
        </Title>
        <Text type="secondary">Khám phá món ngon và đặt hàng ngay!</Text>
      </div>
      <Link to="/restaurants">
        <Button type="primary" size="large">
          Đặt món ngay
        </Button>
      </Link>
    </Space>
  </Card>
);

/* ========================= Page ========================= */
export default function OrderPage() {
  const dispatch = useAppDispatch();
  const { myOrders, loading, error } = useAppSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  return (
    <Layout>
      {/* Use same container classes as your HeroSection for consistent alignment */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#16a34a",
              borderRadius: 12,
            },
            components: {
              Card: { borderRadiusLG: 16 },
              Button: { borderRadius: 10 },
              Tag: { borderRadiusSM: 999 },
            },
          }}
        >
          <div style={{ maxWidth: "100%", margin: "0 auto" }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  Đơn hàng của tôi
                </Title>
                <Text type="secondary">Theo dõi và quản lý các đơn hàng của bạn</Text>
              </Col>
              {/* <Col>
                <Button
                  icon={<RefreshCw size={16} />}
                  onClick={() => dispatch(fetchMyOrders())}
                  loading={loading}
                >
                  Làm mới
                </Button>
              </Col> */}
            </Row>

            {error && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                message="Có lỗi xảy ra"
                description={String(error)}
              />
            )}

            {loading ? (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {[1, 2, 3].map((k) => (
                  <Card key={k}>
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

// src/pages/sections/SpecialDealsSection.jsx
import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch } from "../../redux/store/store";
import { addToCart } from "../../redux/store/slices/cartSlice";
import axios from "axios";

import {
  ConfigProvider,
  Typography,
  Row,
  Col,
  Card,
  Tag,
  Progress,
  Button,
  Space,
  Statistic,
  Skeleton,
  Alert,
  message,
  Empty,
  Spin,
} from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { Countdown } = Statistic;

const API_BASE = process.env.REACT_APP_API_BASE;
const SALE_ENDPOINT = `${API_BASE}/menu-items`; // chỉnh nếu BE khác

export default function SpecialDealsSection() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  // carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const perView = 5; // giống NewShop: 5 thẻ/khung
  const slideWidthPct = 100 / perView; // = 20%

  // Thời gian kết thúc sale (ví dụ +24h)
  const saleEndAt = useMemo(() => Date.now() + 24 * 60 * 60 * 1000, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");
        const res = await axios.get(SALE_ENDPOINT, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { limit: 200 }, // lấy nhiều rồi FE lọc top 10 rẻ nhất
        });
        const data = res?.data?.data ?? res?.data ?? [];

        // Chuẩn hoá: lấy originalPrice tin cậy
 const normalizedAll = Array.isArray(data)
  ? data
      .map((m) => {
        const id = m._id || m.id;
        const name = m.name || m.title || "Món ăn";
        const image = m.image || m.thumbnail || "/placeholder.svg";

        // Lấy id nhà hàng
        const restaurantId = m.restaurant?._id || m.restaurantId || null;

        const originalPrice =
          toNumber(m.basePrice) ??
          toNumber(m.price) ??
          centsToVnd(m.price_cents);

        if (!originalPrice || originalPrice <= 0) return null;

        const salePrice = Math.max(1, Math.round(originalPrice * 0.5));
        const discount = 50;

        const sold = toNumber(m.sold, 0);
        const total =
          toNumber(m.total, 0) ||
          toNumber(m.stock, 0) ||
          Math.max((sold || 0) + 20, 50);

        const isNew = Boolean(m.isNew) || isRecent(m.createdAt, 7);

        return {
          id,
          restaurantId, // lưu lại
          name,
          image,
          originalPrice,
          salePrice,
          discount,
          sold: sold || 0,
          total,
          isNew,
          createdAt: m.createdAt,
        };
      })
      .filter(Boolean)
  : [];

        // Chọn 10 rẻ nhất theo originalPrice
        const top10 = normalizedAll
          .sort((a, b) => (a.originalPrice || 0) - (b.originalPrice || 0))
          .slice(0, 10);

        // “deal mới”: sort createdAt desc (tuỳ chọn)
        top10.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (mounted) {
          setItems(top10);
          setCurrentIndex(0); // reset vị trí khi dữ liệu đổi
        }
      } catch (err) {
        if (mounted)
          setError(
            err?.response?.data?.message || err.message || "Không tải được danh sách khuyến mãi"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // điều hướng giống NewShop
  const maxStep = Math.max(1, (items?.length || 0) - perView + 1);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % maxStep);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + maxStep) % maxStep);

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.salePrice, // GIÁ SALE
        image: product.image,
      })
    );
    
  };



  return (
    
    <ConfigProvider theme={{ token: { colorPrimary: "#16a34a", borderRadius: 12 } }}>
      <div className="max-w-7xl mx-auto px-4 py-12 mb-10">
        {/* Header + nút điều hướng giống NewShop */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
              Khuyến mãi đặc biệt ⚡
            </Title>
            {/* <Text type="secondary">Top 10 món rẻ nhất — giảm thẳng 50%!</Text> */}
          </div>
          <Space>
            <Button onClick={prevSlide} shape="circle" icon={<ChevronLeft size={18} />} />
            <Button onClick={nextSlide} shape="circle" icon={<ChevronRight size={18} />} />
          </Space>
        </div>

        {/* Countdown (để cạnh tiêu đề hay bên dưới đều ok) */}
        <div className="mb-6">
          <Space size={12} direction="horizontal" style={{ background: "#16a34a", borderRadius: 12, padding: "8px 12px" }}>
            <Text strong style={{ color: "#edf5f0ff" }}>Kết thúc trong:</Text>
            <Countdown
              value={saleEndAt}
              format="HH:mm:ss"
              valueStyle={{ fontWeight: 700, color: "#e9f2ecff" }}
              onFinish={() => message.info("Chương trình đã kết thúc")}
            />
          </Space>
        </div>

        {loading && (
          <div className="py-10">
            <div className="overflow-hidden">
              <div className="flex gap-0">
                {Array.from({ length: perView }).map((_, i) => (
                  <div key={i} className="w-1/5 flex-shrink-0 px-2">
                    <Card className="rounded-xl">
                      <Skeleton.Image active style={{ width: "100%", height: 180 }} />
                      <Skeleton active paragraph={{ rows: 3 }} className="mt-3" />
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <Alert type="error" showIcon message="Lỗi" description={error} className="mb-6" />
        )}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <Empty description="Chưa có sản phẩm khuyến mãi" />
            ) : (
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * slideWidthPct}%)` }}
                >
                  {items.map((p) => {
                    const percent = Math.round((p.sold / (p.total || 1)) * 100);
                    const lowStock = percent > 80;
                    return (
                      <Link to={`/restaurants/${p.restaurantId}`} key={p.id} className="w-1/5 flex-shrink-0 px-2">
                        <Card
                          hoverable
                          className="rounded-xl shadow-md"
                          cover={
                            <div className="relative overflow-hidden">
                              <img
                                src={p.image || "/placeholder.svg"}
                                alt={p.name}
                                className="w-full h-48 object-cover"
                                onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                              />
                              <div className="absolute top-3 left-3 flex flex-col gap-2">
                                <Tag color="red" style={{ borderRadius: 999, fontWeight: 700 }}>
                                  -50%
                                </Tag>
                                {p.isNew && (
                                  <Tag color="orange" style={{ borderRadius: 999, fontWeight: 700 }}>
                                    Mới
                                  </Tag>
                                )}
                              </div>
                              {lowStock && (
                                <div
                                  className="absolute top-3 right-3"
                                  style={{
                                    background: "#ef4444",
                                    color: "#fff",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  Sắp hết!
                                </div>
                              )}
                            </div>
                          }
                        >
                          <Space direction="vertical" size={8} style={{ width: "100%" }}>
                            <Text strong ellipsis={{ tooltip: p.name }} style={{ color: "#1f2937" }}>
                              {p.name}
                            </Text>

                            {/* Stock */}
                            <div>
                              <div className="flex justify-between text-xs" style={{ marginBottom: 4, color: "#6b7280" }}>
                                <span>Đã bán: {p.sold}/{p.total}</span>
                                <span
                                  style={{
                                    color: percent > 50 ? "#16a34a" : undefined,
                                    fontWeight: percent > 50 ? 600 : 400,
                                  }}
                                >
                                  {percent}%
                                </span>
                              </div>
                              <Progress percent={percent} size="small" showInfo={false} status={percent > 80 ? "exception" : "active"} />
                            </div>

                            <Space size={8} align="baseline">
                              <Text strong style={{ color: "#16a34a" }}>{toMoney(p.salePrice)}đ</Text>
                              <Text type="secondary" delete>
                                {toMoney(p.originalPrice)}đ
                              </Text>
                            </Space>

                            <Button
                              type="primary"
                              size="middle"
                              icon={<ShoppingCart size={16} />}
                              block
                              onClick={() => handleAddToCart(p)}
                              disabled={p.sold >= p.total}
                            >
                              {p.sold >= p.total ? "Hết hàng" : "Thêm vào giỏ"}
                            </Button>
                          </Space>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* <div className="text-center mt-8">
              <Button size="large" ghost type="primary" onClick={() => message.info("Đi tới trang khuyến mãi (TODO)")}>
                Xem tất cả
              </Button>
            </div> */}
          </>
        )}
      </div>
    </ConfigProvider>
  );
}

/* ===== Helpers ===== */
function toNumber(v, fallback = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function centsToVnd(c) {
  const n = toNumber(c);
  return n != null ? Math.round(n / 100) : null;
}
function isRecent(dateStr, days = 7) {
  if (!dateStr) return false;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff <= days * 24 * 3600 * 1000;
}
function toMoney(v) {
  const n = toNumber(v, 0);
  return n.toLocaleString("vi-VN");
}

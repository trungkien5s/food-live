// src/pages/sections/SpecialDealsSection.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch } from "../../redux/store/store";
import { addToCart } from "../../redux/store/slices/cartSlice";
import axios from "axios";

import {
  ConfigProvider,
  Typography,
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
  Grid,
} from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;
const { Countdown } = Statistic;
const { useBreakpoint } = Grid;

const API_BASE = process.env.REACT_APP_API_BASE;
const SALE_ENDPOINT = `${API_BASE}/menu-items`;

export default function SpecialDealsSection() {
  const dispatch = useAppDispatch();
  const screens = useBreakpoint();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleItems = useMemo(() => {
    if (screens.xl) return 5;
    if (screens.lg) return 4;
    if (screens.md) return 3;
    if (screens.sm) return 2;
    return 1;
  }, [screens]);

  const stepPercent = useMemo(() => 100 / visibleItems, [visibleItems]);

  const maxIndex = useMemo(
    () => Math.max(0, items.length - visibleItems),
    [items.length, visibleItems]
  );

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
          params: { limit: 50 }, // Giảm từ 200 xuống 50
        });

        const data = res?.data?.data ?? res?.data ?? [];
        const normalizedAll = Array.isArray(data)
          ? data
            .map((m) => {
              const id = m._id || m.id;
              const name = m.name || m.title || "Món ăn";
              const image = m.image || m.thumbnail || "/placeholder.svg";
              const restaurantId = m.restaurant?._id || m.restaurantId || null;

              const originalPrice =
                toNumber(m.basePrice) ??
                toNumber(m.price) ??
                centsToVnd(m.price_cents);

              if (!originalPrice || originalPrice <= 0) return null;

              const salePrice = Math.max(1, Math.round(originalPrice * 0.5));
              const sold = toNumber(m.sold, 0);
              const total =
                toNumber(m.total, 0) ||
                toNumber(m.stock, 0) ||
                Math.max((sold || 0) + 20, 50);

              return {
                id,
                restaurantId,
                name,
                image,
                originalPrice,
                salePrice,
                discount: 50,
                sold: sold || 0,
                total,
                isNew: Boolean(m.isNew) || isRecent(m.createdAt, 7),
                createdAt: m.createdAt,
              };
            })
            .filter(Boolean)
          : [];

        const top10 = normalizedAll
          .sort((a, b) => (a.originalPrice || 0) - (b.originalPrice || 0))
          .slice(0, 10)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (mounted) {
          setItems(top10);
          setCurrentIndex(0);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || err.message || "Không tải được danh sách khuyến mãi");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [visibleItems]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((p) => Math.min(p + 1, maxIndex));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((p) => Math.max(p - 1, 0));
  }, []);

  const handleAddToCart = useCallback((product) => {
    dispatch(addToCart({ id: product.id, name: product.name, price: product.salePrice, image: product.image }));
  }, [dispatch]);

  // Windowing: chỉ render items trong viewport + buffer
  const BUFFER = 2;
  const start = Math.max(0, currentIndex - BUFFER);
  const end = Math.min(items.length, currentIndex + visibleItems + BUFFER);
  const windowItems = items.slice(start, end);
  const offsetIndex = currentIndex - start;


  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#16a34a", borderRadius: 12 } }}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 mb-6 sm:mb-10">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Title level={2} style={{ margin: 0, color: "#1f2937" }} className="text-xl sm:text-2xl">
            Khuyến mãi đặc biệt ⚡
          </Title>

          <Space className="hidden sm:flex">
            <Button onClick={prevSlide} shape="circle" icon={<ChevronLeft size={18} />} disabled={currentIndex === 0} />
            <Button onClick={nextSlide} shape="circle" icon={<ChevronRight size={18} />} disabled={currentIndex >= maxIndex} />
          </Space>
        </div>

        <div className="mb-4 sm:mb-6">
          <Space
            size={8}
            direction="horizontal"
            style={{ background: "#16a34a", borderRadius: 12, padding: "6px 10px" }}
            className="sm:p-3"
          >
            <Text strong style={{ color: "#edf5f0ff", fontSize: 13 }} className="sm:text-base">
              Kết thúc trong:
            </Text>
            <Countdown
              value={saleEndAt}
              format="HH:mm:ss"
              valueStyle={{ fontWeight: 700, color: "#e9f2ecff", fontSize: 14 }}
              className="[&_.ant-statistic-content-value]:text-sm sm:[&_.ant-statistic-content-value]:text-base"
              onFinish={() => message.info("Chương trình đã kết thúc")}
            />
          </Space>
        </div>

        {loading && (
          <div className="py-6 sm:py-10">
            <div className="overflow-hidden">
              <div className="flex">
                {Array.from({ length: visibleItems }).map((_, i) => (
                  <div
                    key={i}
                    className="px-2"
                    style={{ flex: `0 0 calc(100% / ${visibleItems})`, maxWidth: `calc(100% / ${visibleItems})` }}
                  >
                    <Card className="rounded-xl">
                      <Skeleton.Image active style={{ width: "100%", height: 140 }} />
                      <Skeleton active paragraph={{ rows: 3 }} className="mt-3" />
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && error && <Alert type="error" showIcon message="Lỗi" description={error} className="mb-6" />}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <Empty description="Chưa có sản phẩm khuyến mãi" />
            ) : (
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${offsetIndex * stepPercent}%)` }}
                >
                  {windowItems.map((p) => {
                    const percent = Math.round((p.sold / (p.total || 1)) * 100);
                    const lowStock = percent > 80;

                    return (
                      <div
                        key={p.id}
                        className="px-2"
                        style={{ flex: `0 0 calc(100% / ${visibleItems})`, maxWidth: `calc(100% / ${visibleItems})` }}
                      >
                        <Link to={`/restaurants/${p.restaurantId}`} className="block">
                          <Card
                            hoverable
                            className="rounded-xl shadow-md overflow-hidden"
                            cover={
                              <div className="relative overflow-hidden h-32 sm:h-40 md:h-44 lg:h-48">
                                <img
                                  src={p.image || "/placeholder.svg"}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />

                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 sm:gap-2">
                                  <Tag color="red" style={{ borderRadius: 999, fontWeight: 700, fontSize: 11 }}>
                                    -50%
                                  </Tag>
                                  {p.isNew && (
                                    <Tag color="orange" style={{ borderRadius: 999, fontWeight: 700, fontSize: 11 }}>
                                      Mới
                                    </Tag>
                                  )}
                                </div>

                                {lowStock && (
                                  <div
                                    className="absolute top-2 right-2 sm:top-3 sm:right-3"
                                    style={{
                                      background: "#ef4444",
                                      color: "#fff",
                                      padding: "2px 6px",
                                      borderRadius: 999,
                                      fontSize: 10,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Sắp hết!
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <Space direction="vertical" size={6} style={{ width: "100%" }}>
                              <Text strong ellipsis={{ tooltip: p.name }} style={{ color: "#1f2937", fontSize: 13 }} className="sm:text-base">
                                {p.name}
                              </Text>

                              <div>
                                <div className="flex justify-between text-xs" style={{ marginBottom: 4, color: "#6b7280" }}>
                                  <span>
                                    Đã bán: {p.sold}/{p.total}
                                  </span>
                                  <span style={{ color: percent > 50 ? "#16a34a" : undefined, fontWeight: percent > 50 ? 600 : 400 }}>
                                    {percent}%
                                  </span>
                                </div>
                                <Progress percent={percent} size="small" showInfo={false} status={percent > 80 ? "exception" : "active"} />
                              </div>

                              <Space size={6} align="baseline">
                                <Text strong style={{ color: "#16a34a", fontSize: 14 }} className="sm:text-base">
                                  {toMoney(p.salePrice)}đ
                                </Text>
                                <Text type="secondary" delete style={{ fontSize: 12 }} className="sm:text-sm">
                                  {toMoney(p.originalPrice)}đ
                                </Text>
                              </Space>

                              <Button
                                type="primary"
                                size="small"
                                icon={<ShoppingCart size={14} />}
                                block
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddToCart(p);
                                }}
                                disabled={p.sold >= p.total}
                                className="text-xs sm:text-sm"
                              >
                                {p.sold >= p.total ? "Hết hàng" : "Thêm vào giỏ"}
                              </Button>
                            </Space>
                          </Card>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex sm:hidden justify-center gap-4 mt-4">
              <Button onClick={prevSlide} shape="circle" icon={<ChevronLeft size={18} />} disabled={currentIndex === 0} />
              <Button onClick={nextSlide} shape="circle" icon={<ChevronRight size={18} />} disabled={currentIndex >= maxIndex} />
            </div>
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

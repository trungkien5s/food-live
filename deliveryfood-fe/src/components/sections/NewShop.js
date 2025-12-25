// src/pages/sections/NewShop.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch } from "../../redux/store/store";
import { useSelector } from "react-redux";
import {
  fetchRestaurants,
  makeSelectNewestRestaurants,
  selectRestaurantsLoading,
  selectRestaurantsError,
} from "../../redux/store/slices/restaurantsSlice";
import { Button, Card, Tag, Typography, Space, ConfigProvider, Spin, Alert, Grid } from "antd";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export default function NewShop() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const [currentIndex, setCurrentIndex] = useState(0);

  const selectTopNewest = useMemo(() => makeSelectNewestRestaurants(10), []);
  const restaurants = useSelector(selectTopNewest) ?? [];
  const loading = useSelector(selectRestaurantsLoading);
  const error = useSelector(selectRestaurantsError);

  useEffect(() => {
    dispatch(fetchRestaurants({ limit: 20 })); // Giảm từ 50 xuống 20
  }, [dispatch]);

  const visibleItems = useMemo(() => {
    if (screens.xl) return 5;
    if (screens.lg) return 4;
    if (screens.md) return 3;
    if (screens.sm) return 2;
    return 1;
  }, [screens]);

  const maxIndex = useMemo(
    () => Math.max(0, restaurants.length - visibleItems),
    [restaurants.length, visibleItems]
  );

  const stepPercent = useMemo(() => 100 / visibleItems, [visibleItems]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [visibleItems]);

  const isNew = (createdAt) => {
    if (!createdAt) return false;
    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
    return days <= 7;
  };

  const BUFFER = 2; // render thêm 2 item hai bên
  const start = Math.max(0, currentIndex - BUFFER);
  const end = Math.min(restaurants.length, currentIndex + visibleItems + BUFFER);
  const windowItems = restaurants.slice(start, end);

  // để slide mượt, dịch thêm phần offset của start
  const offsetIndex = currentIndex - start;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#16a34a", borderRadius: 12 } }}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Title level={2} style={{ margin: 0, color: "#1f2937" }} className="text-xl sm:text-2xl">
            Shop mới lên sàn
          </Title>

          <Space className="hidden sm:flex">
            <Button onClick={prevSlide} shape="circle" icon={<ChevronLeft size={18} />} disabled={currentIndex === 0} />
            <Button onClick={nextSlide} shape="circle" icon={<ChevronRight size={18} />} disabled={currentIndex >= maxIndex} />
          </Space>
        </div>

        {loading && (
          <div className="py-10 flex justify-center">
            <Spin tip="Đang tải nhà hàng..." />
          </div>
        )}

        {!loading && error && (
          <Alert type="error" showIcon message="Lỗi tải nhà hàng" description={error} className="mb-6" />
        )}

        {!loading && !error && (
          <>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${offsetIndex * stepPercent}%)` }}
              >
                {windowItems.map((r) => {
                  const id = r._id || r.id;
                  const img = r.image || "/placeholder.svg";

                  return (
                    <div
                      key={id}
                      className="px-2"
                      style={{
                        flex: `0 0 calc(100% / ${visibleItems})`,
                        maxWidth: `calc(100% / ${visibleItems})`,
                      }}
                    >
                      <Card
                        hoverable
                        className="rounded-xl shadow-md overflow-hidden"
                        cover={
                          <div className="relative overflow-hidden h-32 sm:h-40 md:h-44 lg:h-48">
                            <img
                              src={img}
                              alt={r.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
                              {isNew(r.createdAt) && (
                                <Tag color="green" style={{ borderRadius: 999, fontSize: 11 }}>
                                  Mới
                                </Tag>
                              )}
                              {r.isOpen === false && (
                                <Tag color="red" style={{ borderRadius: 999, fontSize: 11 }}>
                                  Đóng cửa
                                </Tag>
                              )}
                            </div>
                          </div>
                        }
                        onClick={() => navigate(`/restaurants/${id}`)}
                      >
                        <Space direction="vertical" size={4} style={{ width: "100%" }}>
                          <Text strong ellipsis={{ tooltip: r.name }} style={{ color: "#1f2937", fontSize: 14 }}>
                            {r.name}
                          </Text>
                          <Text type="secondary" ellipsis={{ tooltip: r.address }} style={{ fontSize: 12 }}>
                            {r.address || "—"}
                          </Text>
                          <Space size={6} wrap>
                            <Tag color="gold" style={{ fontSize: 11 }}>
                              {(r.rating ?? 0).toFixed(1)}⭐
                            </Tag>
                            <Tag style={{ fontSize: 11 }}>{r.isOpen ? "Đang mở" : "Tạm đóng"}</Tag>
                          </Space>
                        </Space>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile nav */}
            <div className="flex sm:hidden justify-center gap-4 mt-4">
              <Button onClick={prevSlide} shape="circle" icon={<ChevronLeft size={18} />} disabled={currentIndex === 0} />
              <Button onClick={nextSlide} shape="circle" icon={<ChevronRight size={18} />} disabled={currentIndex >= maxIndex} />
            </div>

            <div className="text-center mt-6 sm:mt-8">
              <Button size="large" ghost type="primary" onClick={() => navigate("/restaurants")}>
                Xem tất cả
              </Button>
            </div>
          </>
        )}
      </div>
    </ConfigProvider>
  );
}

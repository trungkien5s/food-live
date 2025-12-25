// src/pages/sections/NearbyRestaurants.jsx
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch } from "../../redux/store/store";
import { useSelector } from "react-redux";
import {
  fetchRestaurants,
  selectRestaurantsLoading,
  selectRestaurantsError,
} from "../../redux/store/slices/restaurantsSlice";
import {
  Button,
  Card,
  Tag,
  Typography,
  Space,
  ConfigProvider,
  Spin,
  Alert,
  Empty,
  Grid,
} from "antd";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export default function NearbyRestaurants() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [currentIndex, setCurrentIndex] = useState(0);

  const items = useSelector((s) => s.restaurants?.items || s.restaurants?.list || []);
  const loading = useSelector(selectRestaurantsLoading);
  const error = useSelector(selectRestaurantsError);

  useEffect(() => {
    dispatch(fetchRestaurants({ limit: 200 }));
  }, [dispatch]);

  // Calculate visible items based on screen size
  const visibleItems = useMemo(() => {
    if (screens.xl) return 5;
    if (screens.lg) return 4;
    if (screens.md) return 3;
    if (screens.sm) return 2;
    return 1; // xs
  }, [screens]);

  // Calculate slide percentage based on visible items
  const slidePercentage = useMemo(() => {
    return 100 / visibleItems;
  }, [visibleItems]);

  const nextSlide = () => {
    const maxStep = Math.max(1, items.length - visibleItems);
    setCurrentIndex((prev) => Math.min(prev + 1, maxStep));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // Reset index when screen size changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [visibleItems]);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#16a34a", borderRadius: 12 } }}>
      <section className="mt-2">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          {/* Header + Navigation Buttons */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Title level={2} style={{ margin: 0, color: "#1f2937" }} className="text-xl sm:text-2xl">
              Quán ăn gần bạn
            </Title>
            <Space className="hidden sm:flex">
              <Button
                onClick={prevSlide}
                shape="circle"
                icon={<ChevronLeft size={18} />}
                disabled={currentIndex === 0}
              />
              <Button
                onClick={nextSlide}
                shape="circle"
                icon={<ChevronRight size={18} />}
                disabled={currentIndex >= items.length - visibleItems}
              />
            </Space>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-6 sm:py-10">
              <div className="overflow-hidden">
                <div className="flex gap-0">
                  {Array.from({ length: visibleItems }).map((_, i) => (
                    <div
                      key={i}
                      className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0 px-2"
                    >
                      <Card className="rounded-xl">
                        <Card.Meta
                          avatar={
                            <div className="w-full h-40 bg-gray-200 animate-pulse rounded-t-xl" />
                          }
                        />
                        <div className="mt-3 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <Alert
              type="error"
              showIcon
              message="Lỗi tải nhà hàng"
              description={error}
              className="mb-6"
            />
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {items.length === 0 ? (
                <Empty description="Chưa có nhà hàng nào" />
              ) : (
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * slidePercentage}%)` }}
                  >
                    {items.map((r) => {
                      const id = r._id || r.id;
                      const img = r.image || "/placeholder.svg";
                      const rating = Number(r.rating ?? 0);
                      return (
                        <div
                          key={id}
                          className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0 px-2"
                        >
                          <Card
                            hoverable
                            className="rounded-xl shadow-md"
                            cover={
                              <div
                                className="relative overflow-hidden"
                                style={{ aspectRatio: "16/10" }}
                              >
                                <img
                                  src={img}
                                  alt={r.name}
                                  className="w-full h-full object-cover"
                                  style={{ minHeight: "180px" }}
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                  }}
                                />
                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
                                  {r.isOpen === false && (
                                    <Tag
                                      color="red"
                                      style={{ borderRadius: 999, fontSize: 11 }}
                                    >
                                      Đóng cửa
                                    </Tag>
                                  )}
                                </div>
                              </div>
                            }
                            onClick={() => navigate(`/restaurants/${id}`)}
                          >
                            <Space direction="vertical" size={4} style={{ width: "100%" }}>
                              <Text
                                strong
                                ellipsis={{ tooltip: r.name }}
                                style={{ color: "#1f2937", fontSize: 13 }}
                                className="sm:text-base"
                              >
                                {r.name}
                              </Text>
                              <Text
                                type="secondary"
                                ellipsis={{ tooltip: r.address }}
                                style={{ fontSize: 12 }}
                              >
                                {r.address || "—"}
                              </Text>
                              <Space size={6} wrap>
                                <Tag color="gold" style={{ fontSize: 11 }}>
                                  {rating.toFixed(1)}⭐
                                </Tag>
                                <Tag style={{ fontSize: 11 }}>
                                  {r.isOpen ? "Đang mở" : "Tạm đóng"}
                                </Tag>
                              </Space>
                            </Space>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile navigation buttons */}
              <div className="flex sm:hidden justify-center gap-4 mt-4">
                <Button
                  onClick={prevSlide}
                  shape="circle"
                  icon={<ChevronLeft size={18} />}
                  disabled={currentIndex === 0}
                />
                <Button
                  onClick={nextSlide}
                  shape="circle"
                  icon={<ChevronRight size={18} />}
                  disabled={currentIndex >= items.length - visibleItems}
                />
              </div>

              {/* View All Button */}
              <div className="text-center mt-6 sm:mt-8">
                <Button
                  size="large"
                  ghost
                  type="primary"
                  onClick={() => navigate("/restaurants")}
                >
                  Xem tất cả
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
    </ConfigProvider>
  );
}
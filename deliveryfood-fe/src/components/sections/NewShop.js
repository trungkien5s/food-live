// src/pages/sections/NewShop.jsx
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch } from "../../redux/store/store";
import { useSelector } from "react-redux";
import {
  fetchRestaurants,
  makeSelectNewestRestaurants,
  selectRestaurantsLoading,
  selectRestaurantsError,
} from "../../redux/store/slices/restaurantsSlice";
import { Button, Card, Tag, Typography, Space, ConfigProvider, Spin, Alert } from "antd";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;

export default function NewShop() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // lấy top 10 mới nhất
  const selectTopNewest = useMemo(() => makeSelectNewestRestaurants(10), []);
  const restaurants = useSelector(selectTopNewest);
  const loading = useSelector(selectRestaurantsLoading);
  const error = useSelector(selectRestaurantsError);

  useEffect(() => {
    dispatch(fetchRestaurants({ limit: 50 })); // đủ dữ liệu để lọc top 10
  }, [dispatch]);

  const nextSlide = () => {
    const maxStep = Math.max(1, restaurants.length - 4);
    setCurrentIndex((prev) => (prev + 1) % maxStep);
  };

  const prevSlide = () => {
    const maxStep = Math.max(1, restaurants.length - 4);
    setCurrentIndex((prev) => (prev - 1 + maxStep) % maxStep);
  };

  const isNew = (createdAt) => {
    if (!createdAt) return false;
    const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
    return days <= 7; // gắn nhãn "Mới" trong 7 ngày
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#16a34a", borderRadius: 12 } }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            Shop mới lên sàn
          </Title>
          <Space>
            <Button onClick={prevSlide} shape="circle" icon={<ChevronLeft size={18} />} />
            <Button onClick={nextSlide} shape="circle" icon={<ChevronRight size={18} />} />
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
                style={{ transform: `translateX(-${currentIndex * 20}%)` }}
              >
                {restaurants.map((r) => {
                  const id = r._id || r.id;
                  const img = r.image || "/placeholder.svg";
                  return (
                    <div key={id} className="w-1/5 flex-shrink-0 px-2">
                      <Card
                        hoverable
                        className="rounded-xl shadow-md"
                        cover={
                          <div className="relative overflow-hidden">
                            <img
                              src={img}
                              alt={r.name}
                              className="w-full h-48 object-cover"
                              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                            />
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              {isNew(r.createdAt) && <Tag color="green" style={{ borderRadius: 999 }}>Mới</Tag>}
                              {r.isOpen === false && <Tag color="red" style={{ borderRadius: 999 }}>Đóng cửa</Tag>}
                            </div>
                          </div>
                        }
                        onClick={() => navigate(`/restaurants/${id}`)}
                      >
                        <Space direction="vertical" size={6} style={{ width: "100%" }}>
                          <Text strong ellipsis={{ tooltip: r.name }} style={{ color: "#1f2937" }}>
                            {r.name}
                          </Text>
                          <Text type="secondary" ellipsis={{ tooltip: r.address }}>
                            {r.address || "—"}
                          </Text>
                          <Space size={8}>
                            <Tag color="gold">{(r.rating ?? 0).toFixed(1)}⭐</Tag>
                            <Tag>{r.isOpen ? "Đang mở" : "Tạm đóng"}</Tag>
                          </Space>
                          {/* <Button type="primary" block>
                            Xem nhà hàng
                          </Button> */}
                        </Space>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-8">
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

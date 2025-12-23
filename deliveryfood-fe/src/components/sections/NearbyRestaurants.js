import { useEffect } from "react";
import { useAppDispatch } from "../../redux/store/store";
import { useSelector } from "react-redux";
import { Row, Col, Typography, Spin, Alert } from "antd";
import { useNavigate } from "react-router-dom";

import {
  fetchRestaurants,
  selectRestaurantsLoading,
  selectRestaurantsError,
} from "../../redux/store/slices/restaurantsSlice";
import RestaurantCard from "../../pages/user/restaurantsPage/RestaurantCard";

// Import RestaurantCard từ RestaurantsPage (cần export ở đó)

const { Title } = Typography;

export default function NearbyRestaurants() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const items = useSelector((s) => s.restaurants?.items || s.restaurants?.list || []);
  const loading = useSelector(selectRestaurantsLoading);
  const error = useSelector(selectRestaurantsError);

  useEffect(() => {
    dispatch(fetchRestaurants({ limit: 200 }));
  }, [dispatch]);

  return (
    <section className="mt-2">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Title level={2} style={{ marginBottom: 24, color: "#1f2937" }}>
          Quán ăn gần bạn
        </Title>

        {loading && (
          <div className="py-8 flex justify-center">
            <Spin tip="Đang tải nhà hàng..." />
          </div>
        )}

        {!loading && error && (
          <Alert
            type="error"
            showIcon
            message="Lỗi tải nhà hàng"
            description={error}
            className="mb-6"
          />
        )}

        {!loading && !error && (
          <Row gutter={[16, 16]}>
            {items.map((r) => (
              <Col key={r._id || r.id} xs={24} sm={12} lg={8} xl={6}>
                <RestaurantCard r={{
                  id: r._id || r.id,
                  name: r.name,
                  image: r.image || "/placeholder.svg",
                  rating: Number(r.rating ?? 0),
                  address: r.address || "—",
                  isOpen: r.isOpen ?? true,
                }} />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </section>
  );
}

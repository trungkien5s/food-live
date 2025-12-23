import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../components/layout/Layout";
import axios from "axios";
import { Link } from "react-router-dom";

// Ant Design
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Typography,
  Space,
  Pagination,
  Skeleton,
  Empty,
  Grid,
  theme,
  message,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import RestaurantCard from "./RestaurantCard";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const PAGE_SIZE = 12;

// safe pick
const pick = (r, keys, fallback = undefined) => {
  for (const k of keys) {
    const v = k.split(".").reduce((acc, cur) => (acc ? acc[cur] : undefined), r);
    if (v !== undefined && v !== null) return v;
  }
  return fallback;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("rating_desc"); // rating_desc | rating_asc | name_asc | time_asc | price_asc
  const [page, setPage] = useState(1);

  const screens = useBreakpoint();
  const { token } = theme.useToken();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const base = process.env.REACT_APP_API_BASE || "";
        const { data } = await axios.get(`${base}/restaurants`);
        const list = Array.isArray(data) ? data : (data?.data ?? data?.restaurants ?? []);
        if (mounted) setRestaurants(Array.isArray(list) ? list : []);
      } catch (e) {
        if (mounted) {
          const msg = e?.response?.data?.message || e.message || "Load restaurants failed";
          setErr(msg);
          message.error(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // chuẩn hoá dữ liệu
  const normalized = useMemo(() => {
    return restaurants.map((r) => ({
      id: pick(r, ["id", "_id"]),
      name: pick(r, ["name", "title"], "Unnamed"),
      image: pick(r, ["image", "imageUrl", "cover", "photo", "photos.0"]),
      rating: Number(pick(r, ["rating", "avgRating", "score"], 0)),
      cuisines: pick(r, ["cuisines", "tags"], []),
      // after – only take actual address fields
      address: pick(r, ["address.formatted", "address.city", "address"], ""),

      deliveryTime: Number(pick(r, ["deliveryTime", "etaMinutes"], 0)),
      priceRange: Number(pick(r, ["priceRange", "price_level"], 0)),
      isOpen: Boolean(pick(r, ["isOpen", "open"], true)) || pick(r, ["status"], "open") === "open",
      raw: r,
    }));
  }, [restaurants]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const arr = term
      ? normalized.filter((r) => {
          const inName = r.name?.toLowerCase().includes(term);
          const inAddr = r.address?.toLowerCase().includes(term);
          const inCuisine = Array.isArray(r.cuisines) && r.cuisines.join(" ").toLowerCase().includes(term);
          return inName || inAddr || inCuisine;
        })
      : normalized;

    const sorted = [...arr].sort((a, b) => {
      switch (sortBy) {
        case "rating_desc":
          return (b.rating || -1) - (a.rating || -1);
        case "rating_asc":
          return (a.rating || 1e9) - (b.rating || 1e9);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "time_asc":
          return (a.deliveryTime || 1e9) - (b.deliveryTime || 1e9);
        case "price_asc":
          return (a.priceRange || 1e9) - (b.priceRange || 1e9);
        default:
          return 0;
      }
    });

    return sorted;
  }, [normalized, q, sortBy]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => {
    // reset về trang 1 khi lọc/tìm/sắp xếp
    setPage(1);
  }, [q, sortBy]);

  return (
    <Layout>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: screens.xs ? "16px" : "24px" }}>
        {/* Header */}
        <Row align="middle" justify="space-between" gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                Nhà hàng
              </Title>
              <Text type="secondary">{loading ? "Đang tải..." : `Tìm thấy ${total} nhà hàng`}</Text>
            </Space>
          </Col>

          <Col flex="none">
            <Space wrap size={12}>
              {/* Search */}
              <Input
                allowClear
                size={screens.md ? "middle" : "small"}
                placeholder="Tìm theo tên, địa chỉ, món..."
                prefix={<SearchOutlined />}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: screens.sm ? 320 : 220 }}
              />

              {/* Sort */}
              <Select
                size={screens.md ? "middle" : "small"}
                value={sortBy}
                style={{ width: screens.sm ? 260 : 200 }}
                onChange={setSortBy}
                options={[
                  { value: "rating_desc", label: "Điểm cao → thấp" },
                  { value: "rating_asc", label: "Điểm thấp → cao" },
                  { value: "name_asc", label: "Tên (A→Z)" },
                  { value: "time_asc", label: "Giao nhanh" },
                  { value: "price_asc", label: "Giá rẻ" },
                ]}
              />
            </Space>
          </Col>
        </Row>

        {/* Lỗi */}
        {err && (
          <Card style={{ marginBottom: 16, borderColor: token.colorErrorBorder, background: token.colorErrorBg }}>
            <Text type="danger">{err}</Text>
          </Card>
        )}

        {/* Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : pageItems.length === 0 ? (
          <Card>
            <Empty
              description={
                <Space direction="vertical" size={2}>
                  <Text strong>Không tìm thấy nhà hàng phù hợp</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Thử đổi từ khóa khác hoặc xoá bộ lọc.
                  </Text>
                </Space>
              }
            >
              <Link to="#" onClick={() => setQ("")}>
                <Text>Xóa tìm kiếm</Text>
              </Link>
            </Empty>
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {pageItems.map((r) => (
                <Col
                  key={r.id || r.name}
                  xs={24}
                  sm={12}
                  lg={8}
                  xl={6}
                >
                  <RestaurantCard r={r} />
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            <Row justify="center" style={{ marginTop: 16 }}>
              <Pagination
                current={current}
                total={total}
                pageSize={PAGE_SIZE}
                showSizeChanger={false}
                onChange={(p) => setPage(p)}
              />
            </Row>
          </>
        )}
      </div>
    </Layout>
  );
}

/* ========================= Remaining Components ========================= */

function SkeletonGrid() {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
        <Col key={idx} xs={24} sm={12} lg={8} xl={6}>
          <Card hoverable style={{ borderRadius: 16, overflow: "hidden" }}>
            <div style={{ height: 160, overflow: "hidden" }}>
              <Skeleton.Image active style={{ width: "100%", height: 160 }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Skeleton active paragraph={{ rows: 2 }} title />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
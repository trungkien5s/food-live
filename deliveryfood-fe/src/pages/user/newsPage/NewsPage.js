import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../components/layout/Layout";
import axios from "axios";
import { Link } from "react-router-dom";

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
  Tag,
  Avatar,
} from "antd";
import { SearchOutlined, CalendarOutlined, GlobalOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;
const { Meta } = Card;
const PAGE_SIZE = 12;

// Lưu ý: Bạn cần đăng ký API key miễn phí tại https://newsapi.org/register
const NEWS_API_KEY = "f31f0a7365b04f989a444a07597b34ba"; // Thay bằng API key của bạn
const NEWS_API_BASE = "https://newsapi.org/v2";

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("food"); // food, restaurant, recipe, cooking
  const [sortBy, setSortBy] = useState("publishedAt"); // publishedAt, popularity, relevancy
  const [page, setPage] = useState(1);

  const screens = useBreakpoint();
  const { token } = theme.useToken();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Kiểm tra API key
        if (NEWS_API_KEY === "YOUR_API_KEY_HERE") {
          throw new Error(
            "Vui lòng đăng ký API key miễn phí tại https://newsapi.org/register và thay vào NEWS_API_KEY"
          );
        }

        // Gọi NewsAPI với keyword về food
        const searchQuery = q.trim() || category;
        const { data } = await axios.get(`${NEWS_API_BASE}/everything`, {
          params: {
            q: searchQuery,
            language: "en",
            sortBy: sortBy,
            pageSize: 100, // Lấy nhiều để filter và paginate ở client
            apiKey: NEWS_API_KEY,
          },
        });

        if (mounted) {
          const list = data?.articles || [];
          setArticles(list);
        }
      } catch (e) {
        if (mounted) {
          const msg = e?.response?.data?.message || e.message || "Không thể tải tin tức";
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
  }, [category, sortBy]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter by search query
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return articles;

    return articles.filter((article) => {
      const inTitle = article.title?.toLowerCase().includes(term);
      const inDesc = article.description?.toLowerCase().includes(term);
      const inSource = article.source?.name?.toLowerCase().includes(term);
      return inTitle || inDesc || inSource;
    });
  }, [articles, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, category, sortBy]);

  return (
    <Layout>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: screens.xs ? "16px" : "24px" }}>
        {/* Header */}
        <Row align="middle" justify="space-between" gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space direction="vertical" size={4}>
              <Title level={3} style={{ margin: 0 }}>
                Tin tức ẩm thực
              </Title>
              <Text type="secondary">
                {loading ? "Đang tải..." : `Tìm thấy ${total} bài viết`}
              </Text>
            </Space>
          </Col>

          <Col flex="none">
            <Space wrap size={12}>
              {/* Search */}
              <Input
                allowClear
                size={screens.md ? "middle" : "small"}
                placeholder="Tìm theo tiêu đề, nguồn..."
                prefix={<SearchOutlined />}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: screens.sm ? 260 : 200 }}
              />

              {/* Category */}
              <Select
                size={screens.md ? "middle" : "small"}
                value={category}
                style={{ width: screens.sm ? 180 : 140 }}
                onChange={setCategory}
                options={[
                  { value: "food", label: "Đồ ăn" },
                  { value: "restaurant", label: "Nhà hàng" },
                  { value: "recipe", label: "Công thức" },
                  { value: "cooking", label: "Nấu ăn" },
                  { value: "chef", label: "Đầu bếp" },
                ]}
              />

              {/* Sort */}
              <Select
                size={screens.md ? "middle" : "small"}
                value={sortBy}
                style={{ width: screens.sm ? 180 : 140 }}
                onChange={setSortBy}
                options={[
                  { value: "publishedAt", label: "Mới nhất" },
                  { value: "popularity", label: "Phổ biến" },
                  { value: "relevancy", label: "Liên quan" },
                ]}
              />
            </Space>
          </Col>
        </Row>

        {/* Error */}
        {err && (
          <Card
            style={{
              marginBottom: 16,
              borderColor: token.colorErrorBorder,
              background: token.colorErrorBg,
            }}
          >
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
                  <Text strong>Không tìm thấy bài viết phù hợp</Text>
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
              {pageItems.map((article, idx) => (
                <Col key={idx} xs={24} sm={12} lg={8} xl={6}>
                  <NewsCard article={article} formatDate={formatDate} />
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

/* ========================= Components ========================= */

function NewsCard({ article, formatDate }) {
  const handleClick = () => {
    if (article.url) {
      window.open(article.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      hoverable
      style={{
        borderRadius: 16,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      cover={
        article.urlToImage ? (
          <div
            style={{
              height: 160,
              backgroundImage: `url(${article.urlToImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <div
            style={{
              height: 160,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 48 }}>🍽️</Text>
          </div>
        )
      }
      onClick={handleClick}
    >
      <Meta
        title={
          <Text
            strong
            ellipsis={{ rows: 2 }}
            style={{ fontSize: 15, lineHeight: 1.4, marginBottom: 8 }}
          >
            {article.title}
          </Text>
        }
        description={
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Paragraph
              ellipsis={{ rows: 3 }}
              style={{ marginBottom: 0, fontSize: 13, color: "#595959" }}
            >
              {article.description || "Không có mô tả"}
            </Paragraph>

            <Space size={8} wrap>
              {article.source?.name && (
                <Tag icon={<GlobalOutlined />} color="blue" style={{ margin: 0 }}>
                  {article.source.name}
                </Tag>
              )}
              {article.publishedAt && (
                <Tag icon={<CalendarOutlined />} style={{ margin: 0 }}>
                  {formatDate(article.publishedAt)}
                </Tag>
              )}
            </Space>

            {article.author && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tác giả: {article.author}
              </Text>
            )}
          </Space>
        }
      />
    </Card>
  );
}

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
              <Skeleton active paragraph={{ rows: 3 }} title />
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
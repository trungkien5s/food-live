import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Card, Space, Tag, Typography } from "antd";
import { StarFilled, EnvironmentOutlined } from "@ant-design/icons";

const { Text } = Typography;

/**
 * Memoized Restaurant Card Component
 * Tối ưu để tránh re-render không cần thiết
 */
const RestaurantCard = memo(function RestaurantCard({ r }) {
  const img = r.image;
  const ratingText = Number.isFinite(r.rating) ? r.rating.toFixed(1) : "-";

  // Nếu server trả về dist.calculated (met)
  const distanceKm = r.dist?.calculated != null
    ? (r.dist.calculated / 1000).toFixed(1)
    : null;

  return (
    <Link to={`/restaurants/${r._id || r.id}`} style={{ display: "block" }}>
      <Card
        hoverable
        style={{ borderRadius: 16, overflow: "hidden" }}
        cover={
          <div className="relative bg-gray-100" style={{ aspectRatio: '16/10', minHeight: '160px' }}>
            {img ? (
              <img
                src={img}
                alt={r.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/600x400?text=No+Image";
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: 12,
                }}
              >
                Không có ảnh
              </div>
            )}
            <OpenBadge open={r.isOpen} />
          </div>
        }
      >
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          {/* Tên + rating */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <Text
              strong
              ellipsis={{ tooltip: r.name }}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                lineHeight: 1.4
              }}
            >
              {r.name}
            </Text>
            <Space size={4} style={{ flexShrink: 0 }}>
              <StarFilled style={{ fontSize: 13, color: "#facc15" }} />
              <Text style={{ fontSize: 13 }}>{ratingText}</Text>
            </Space>
          </div>

          {/* Địa chỉ */}
          <Space size={4} style={{ color: "#666", width: "100%" }}>
            <EnvironmentOutlined style={{ fontSize: 12, flexShrink: 0 }} />
            <Text
              type="secondary"
              ellipsis={{ tooltip: r.address }}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 12,
                lineHeight: 1.3
              }}
            >
              {typeof r.address === 'string' && r.address.trim() !== ''
                ? r.address
                : "—"}
            </Text>
          </Space>

          {/* Khoảng cách */}
          {distanceKm && (
            <Space size={4} style={{ color: "#666" }}>
              <EnvironmentOutlined style={{ fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {distanceKm} km
              </Text>
            </Space>
          )}
        </Space>
      </Card>
    </Link>
  );
});

const OpenBadge = memo(function OpenBadge({ open }) {
  return (
    <div style={{ position: "absolute", top: 8, left: 8 }}>
      <Tag color={open ? "green" : "default"} style={{ borderRadius: 999 }}>
        {open ? "Đang mở" : "Đóng cửa"}
      </Tag>
    </div>
  );
});

export default RestaurantCard;

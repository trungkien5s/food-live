import React from "react";
import { Link } from "react-router-dom";
import { Card, Space, Tag, Typography } from "antd";
import { StarFilled, EnvironmentOutlined } from "@ant-design/icons";

const { Text } = Typography;

function RestaurantCard({ r }) {
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
          <div style={{ position: "relative", height: 160, background: "#f5f5f5" }}>
            {img ? (
              <img
                src={img}
                alt={r.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          {/* Tên + rating */}
          <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
            <Text strong style={{ maxWidth: 200 }} ellipsis>
              {r.name}
            </Text>
            <Space size={4}>
              <StarFilled style={{ fontSize: 14, color: "#facc15" }} />
              <Text>{ratingText}</Text>
            </Space>
          </Space>

          {/* Địa chỉ */}
          {/* Địa chỉ */}
<Space size={6} style={{ color: "#666" }}>
  <EnvironmentOutlined />
  <Text type="secondary" ellipsis style={{ maxWidth: 260 }}>
    {typeof r.address === 'string' && r.address.trim() !== ''
      ? r.address
      : "—"}
  </Text>
</Space>


          {/* Khoảng cách */}
          {distanceKm && (
            <Space size={6} style={{ color: "#666" }}>
              <EnvironmentOutlined />
              <Text type="secondary">
                {distanceKm} km
              </Text>
            </Space>
          )}
        </Space>
      </Card>
    </Link>
  );
}

function OpenBadge({ open }) {
  return (
    <div style={{ position: "absolute", top: 8, left: 8 }}>
      <Tag color={open ? "green" : "default"} style={{ borderRadius: 999 }}>
        {open ? "Đang mở" : "Đóng cửa"}
      </Tag>
    </div>
  );
}

export default RestaurantCard;

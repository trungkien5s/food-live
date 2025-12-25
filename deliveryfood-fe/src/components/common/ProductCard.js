// src/components/common/ProductCard.js
import React, { memo } from "react";
import { Card, Tag, Progress, Button, Space, Typography } from "antd";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const { Text } = Typography;

/**
 * Memoized Product Card Component
 * Tối ưu để tránh re-render không cần thiết
 */
const ProductCard = memo(({
    product,
    visibleItems,
    onAddToCart,
    showProgress = true,
    showDiscount = false,
}) => {
    const {
        id,
        restaurantId,
        name,
        image,
        salePrice,
        originalPrice,
        sold = 0,
        total = 100,
        isNew = false,
    } = product;

    const percent = Math.round((sold / (total || 1)) * 100);
    const lowStock = percent > 80;

    return (
        <div
            className="px-2"
            style={{
                flex: `0 0 calc(100% / ${visibleItems})`,
                maxWidth: `calc(100% / ${visibleItems})`,
            }}
        >
            <Link
                to={`/restaurants/${restaurantId}`}
                className="block"
            >
                <Card
                    hoverable
                    className="rounded-xl shadow-md overflow-hidden"
                    cover={
                        <div className="relative overflow-hidden h-32 sm:h-40 md:h-44 lg:h-48">
                            <img
                                src={image || "/placeholder.svg"}
                                alt={name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.src = "/placeholder.svg";
                                }}
                            />

                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 sm:gap-2">
                                {showDiscount && (
                                    <Tag color="red" style={{ borderRadius: 999, fontWeight: 700, fontSize: 11 }}>
                                        -50%
                                    </Tag>
                                )}
                                {isNew && (
                                    <Tag color="orange" style={{ borderRadius: 999, fontWeight: 700, fontSize: 11 }}>
                                        Mới
                                    </Tag>
                                )}
                            </div>

                            {lowStock && showProgress && (
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
                        <Text
                            strong
                            ellipsis={{ tooltip: name }}
                            style={{ color: "#1f2937", fontSize: 13 }}
                            className="sm:text-base"
                        >
                            {name}
                        </Text>

                        {showProgress && (
                            <div>
                                <div
                                    className="flex justify-between text-xs"
                                    style={{ marginBottom: 4, color: "#6b7280" }}
                                >
                                    <span>
                                        Đã bán: {sold}/{total}
                                    </span>
                                    <span
                                        style={{
                                            color: percent > 50 ? "#16a34a" : undefined,
                                            fontWeight: percent > 50 ? 600 : 400,
                                        }}
                                    >
                                        {percent}%
                                    </span>
                                </div>
                                <Progress
                                    percent={percent}
                                    size="small"
                                    showInfo={false}
                                    status={percent > 80 ? "exception" : "active"}
                                />
                            </div>
                        )}

                        <Space size={6} align="baseline">
                            <Text
                                strong
                                style={{ color: "#16a34a", fontSize: 14 }}
                                className="sm:text-base"
                            >
                                {toMoney(salePrice)}đ
                            </Text>
                            {originalPrice && originalPrice !== salePrice && (
                                <Text
                                    type="secondary"
                                    delete
                                    style={{ fontSize: 12 }}
                                    className="sm:text-sm"
                                >
                                    {toMoney(originalPrice)}đ
                                </Text>
                            )}
                        </Space>

                        {onAddToCart && (
                            <Button
                                type="primary"
                                size="small"
                                icon={<ShoppingCart size={14} />}
                                block
                                onClick={(e) => {
                                    e.preventDefault();
                                    onAddToCart(product);
                                }}
                                disabled={sold >= total}
                                className="text-xs sm:text-sm"
                            >
                                {sold >= total ? "Hết hàng" : "Thêm vào giỏ"}
                            </Button>
                        )}
                    </Space>
                </Card>
            </Link>
        </div>
    );
});

ProductCard.displayName = "ProductCard";

// Helper function
function toMoney(v) {
    const n = Number(v) || 0;
    return n.toLocaleString("vi-VN");
}

export default ProductCard;

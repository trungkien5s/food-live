import {
  Avatar,
  List,
  Space,
  Tag,
  Button,
  Popconfirm,
  Typography,
} from "antd";
import { ShopOutlined, DeleteOutlined } from "@ant-design/icons";
import CartItem from "./CartItem";
import { formatCurrency, groupSubtotal, imgSrc } from "./CartUtils";
import { Link } from "react-router-dom";

const { Text } = Typography;

export default function CartGroup({
  group,
  onUpdateQty,
  onRemoveItem,
  onClearGroup,
  goCheckoutForGroup,
}) {
  /** URL chi tiết nhà hàng */
  const restaurantLink = `/restaurants/${group.id || group._id}`;

  const header = (
    <Space
      align="center"
      style={{ width: "100%", justifyContent: "space-between" }}
    >
      {/* ==== Phần click-được ==== */}
      <Link
        to={restaurantLink}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        {group.image ? (
          <Avatar
            shape="square"
            size={32}
            src={imgSrc(group.image)}
            icon={<ShopOutlined />}
          />
        ) : (
          <Avatar shape="square" size={32} icon={<ShopOutlined />} />
        )}
        <div>
          <div style={{ fontWeight: 600 }}>{group.name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {group.items.length} món
          </Text>
        </div>
        {group.isOpen && (
          <Tag color="green" style={{ marginLeft: 4 }}>
            Mở cửa
          </Tag>
        )}
      </Link>
      {/* ========================= */}

      <Popconfirm
        title="Xoá giỏ hàng này?"
        okText="Xoá"
        cancelText="Huỷ"
        onConfirm={() => onClearGroup(group.id)}
      >
        <Button type="text" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </Space>
  );

  return (
    <List
      header={header}
      itemLayout="vertical"
      dataSource={group.items}
      renderItem={(it, idx) => (
        <CartItem
          key={it?.id || it?._id}
          item={it}
          index={idx}
          onUpdateQty={onUpdateQty}
          onRemoveItem={onRemoveItem}
          onClickTitle={() => goCheckoutForGroup(group)}
        />
      )}
      footer={
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text type="secondary">Tạm tính</Text>
          <Text strong>{formatCurrency(groupSubtotal(group))}</Text>
        </Space>
      }
      style={{
        marginBottom: 16,
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        padding: 8,
      }}
    />
  );
}

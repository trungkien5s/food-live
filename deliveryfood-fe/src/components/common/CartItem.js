import { useMemo } from "react";
import { List, Space, Typography, Button, InputNumber, Tag, Popconfirm, Image } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { formatCurrency, getItemId, getItemImage, getItemName, getUnitPrice } from "./CartUtils";

const { Text } = Typography;

export default function CartItem({ item, index, onUpdateQty, onRemoveItem, onClickTitle }) {
  const id = getItemId(item);
  const name = getItemName(item, index);
  const qty = Number(item?.quantity ?? 1);
  const unit = getUnitPrice(item);
  const image = getItemImage(item);
  const lineTotal = unit * qty;
  const options = Array.isArray(item?.selectedOptions) ? item.selectedOptions : [];

  const optionText = useMemo(() => {
    if (options.length === 0) return null;
    const s = options.map((op) => op?.name ?? op?.label ?? op).join(", ");
    return s;
  }, [options]);

  return (
    <List.Item
      actions={[
        <Space key="qty" align="center">
          <Text>Số lượng</Text>
          <InputNumber
            min={1}
            value={qty}
            onChange={(v) => onUpdateQty(item, Number(v || 1))}
            size="small"
          />
        </Space>,
        <Popconfirm
          key="del"
          title="Xoá khỏi giỏ?"
          okText="Xoá"
          cancelText="Huỷ"
          onConfirm={() => onRemoveItem(id)}
        >
          <Button danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>,
      ]}
      extra={
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600, color: "#16a34a" }}>{formatCurrency(lineTotal)}</div>
          {unit > 0 && <Text type="secondary">{formatCurrency(unit)}/món</Text>}
        </div>
      }
    >
      <List.Item.Meta
        avatar={
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            width={64}
            height={64}
            style={{ objectFit: "cover", borderRadius: 8 }}
            fallback="https://placehold.co/64x64/f3f4f6/9ca3af?text=🍽️"
            preview={false}
          />
        }
        title={
          <a onClick={onClickTitle} style={{ fontWeight: 600 }}>
            {name}
          </a>
        }
        description={
          optionText ? (
            <Space wrap>
              <Text type="secondary">Tuỳ chọn:</Text>
              <Text>{optionText}</Text>
            </Space>
          ) : null
        }
      />
    </List.Item>
  );
}
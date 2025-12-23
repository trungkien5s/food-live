// src/components/common/CartDrawer.jsx
import { Drawer, Empty, Alert, Button, Space, Divider } from "antd";
import { ShoppingCartOutlined, DeleteOutlined } from "@ant-design/icons";
import CartGroup from "./CartGroup";
import { formatCurrency, groupSubtotal } from "./CartUtils";

export default function CartDrawer({
  open,
  onClose,
  groups = [],
  loading,
  error,
  currentRestaurantId,
  onUpdateQty,
  onRemoveItem,
  onClearGroup,
  goCheckoutForGroup,
}) {
  const flatCount = (groups || []).reduce((s, g) => s + (g.items?.length || 0), 0);
  const currentGroup = groups?.[0];

  return (
    <Drawer
      title={
        <Space>
          <ShoppingCartOutlined />
          <span>Giỏ hàng</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={420}
      bodyStyle={{ paddingBottom: 140 }} // reserve space for sticky footer
      destroyOnClose={false}
    >
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}

      {!loading && flatCount === 0 && !error && (
        <Empty description="Giỏ hàng trống" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {(groups || []).map((group) => (
        <CartGroup
          key={group.id || group._id}
          group={group}
          onUpdateQty={onUpdateQty}
          onRemoveItem={onRemoveItem}
          onClearGroup={onClearGroup}
          goCheckoutForGroup={goCheckoutForGroup}
        />
      ))}

      {/* Footer actions (sticky) */}
      {currentRestaurantId && currentGroup && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#fff",
            padding: 12,
            boxShadow: "0 -6px 16px rgba(0,0,0,0.06)",
            zIndex: 30,
          }}
        >
          <Divider style={{ margin: "8px 0" }} />
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              type="primary"
              block
              onClick={() => goCheckoutForGroup(currentGroup)}
              disabled={currentGroup.items.length === 0}
            >
              Đặt món • {formatCurrency(groupSubtotal(currentGroup))}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              block
              onClick={() => onClearGroup(currentRestaurantId)}
              disabled={loading || currentGroup.items.length === 0}
            >
              Xoá giỏ nhà hàng này
            </Button>
          </Space>
        </div>
      )}
    </Drawer>
  );
}

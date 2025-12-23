// src/pages/admin/manageOrders/ManageOrders.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Card, Table, Space, Button, Select, Tag, Typography, Modal, message
} from 'antd';
import {
  ReloadOutlined, EyeOutlined, CalendarOutlined
} from '@ant-design/icons';
import AdminLayout from '../../../components/layout/adminLayout/AdminLayout';

const { Text } = Typography;
const { Option } = Select;

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const PAYMENT_METHODS = ['CASH', 'CARD', 'MOMO', 'ZALOPAY', 'VNPAY', 'BANKING'];
const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY',
  'ASSIGNED', 'PICKING_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'
];

// helper màu Tag
const colorPaymentStatus = (s) => {
  switch (s) {
    case 'PAID': return 'green';
    case 'FAILED': return 'red';
    case 'REFUNDED': return 'volcano';
    default: return 'default';
  }
};
const colorOrderStatus = (s) => {
  switch (s) {
    case 'CONFIRMED': return 'blue';
    case 'PREPARING': return 'orange';
    case 'READY': return 'cyan';
    case 'ASSIGNED': return 'geekblue';
    case 'PICKING_UP': return 'purple';
    case 'DELIVERING': return 'processing';
    case 'DELIVERED': return 'green';
    case 'CANCELLED': return 'red';
    default: return 'default';
  }
};
const colorPaymentMethod = (m) => {
  switch (m) {
    case 'CASH': return 'gold';
    case 'CARD': return 'blue';
    case 'MOMO': return 'magenta';
    case 'ZALOPAY': return 'geekblue';
    case 'VNPAY': return 'cyan';
    case 'BANKING': return 'purple';
    default: return 'default';
  }
};

export const ManageOrders = () => {
  const API_BASE = process.env.REACT_APP_API_BASE;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [paymentStatus, setPaymentStatus] = useState();
  const [paymentMethod, setPaymentMethod] = useState();
  const [status, setStatus] = useState();

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchOrders = async () => {
  try {
    setLoading(true);

    const resp = await axios.get(`${API_BASE}/orders`, {
      params: {
        page,
        limit,
        paymentStatus: paymentStatus || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
      }
    });

    // Unwrap theo đúng schema bạn đưa
    const root = resp.data?.data ?? resp.data; // { data: [...], pagination: {...} }
    const list = root?.data ?? root?.results ?? root?.items ?? []; // ← CHÍNH ở đây
    const totalCount = root?.pagination?.total ?? root?.total ?? root?.count ?? list.length;

    const mapped = list.map((o) => ({
      id: o._id || o.id,
      code: o.code || o.orderCode || (o._id ?? ''),
      customerName: o.user?.name || o.customer?.name || o.customerName || '—',
      customerEmail: o.user?.email || o.customer?.email || o.customerEmail || '—',
      total: o.fees?.totalAmount ?? o.total ?? o.totalAmount ?? 0, // ưu tiên fees.totalAmount
      paymentMethod: o.paymentMethod || 'CASH',
      paymentStatus: o.paymentStatus || 'PENDING',
      status: o.status || 'PENDING',
      createdAt: o.createdAt ? new Date(o.createdAt) : (o.timing?.orderTime ? new Date(o.timing.orderTime) : null),
      raw: o,
    }));

    setOrders(mapped);
    setTotal(totalCount);
  } catch (err) {
    console.error('Fetch orders error:', err);
    setOrders([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, paymentStatus, paymentMethod, status]);

  const viewDetail = async (record) => {
    try {
      const resp = await axios.get(`${API_BASE}/orders/${record.id}`);
      const data = resp.data?.data ?? resp.data;
      Modal.info({
        title: `Chi tiết đơn #${record.code}`,
        width: 720,
        content: (
          <pre style={{
            background: '#f6f6f6',
            padding: 12,
            borderRadius: 8,
            maxHeight: 520,
            overflow: 'auto'
          }}>
{JSON.stringify(data, null, 2)}
          </pre>
        )
      });
    } catch (err) {
      console.error('View order error:', err);
      message.error('Không lấy được chi tiết đơn hàng');
    }
  };

  const columns = useMemo(() => ([
    {
      title: 'Mã đơn',
      dataIndex: 'code',
      key: 'code',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text>{r.customerName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.customerEmail}</Text>
        </div>
      )
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (v) => <Text>{v?.toLocaleString('vi-VN')}₫</Text>
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={colorPaymentMethod(r.paymentMethod)}>{r.paymentMethod}</Tag>
          <Tag color={colorPaymentStatus(r.paymentStatus)}>{r.paymentStatus}</Tag>
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={colorOrderStatus(s)}>{s}</Tag>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => d ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
          <Text style={{ fontSize: 13 }}>
            {d.toLocaleString('vi-VN')}
          </Text>
        </div>
      ) : '—'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            Xem
          </Button>
          {/* Nếu cần thêm sửa/xóa sau này:
          <Button type="link" onClick={() => openEdit(record)}>Sửa</Button>
          <Button danger type="link" onClick={() => onDelete(record)}>Xóa</Button>
          */}
        </Space>
      )
    }
  ]), []);

  return (
    <AdminLayout>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="Payment Status"
            style={{ width: 200 }}
            value={paymentStatus}
            onChange={setPaymentStatus}
          >
            {PAYMENT_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>

          <Select
            allowClear
            placeholder="Payment Method"
            style={{ width: 200 }}
            value={paymentMethod}
            onChange={setPaymentMethod}
          >
            {PAYMENT_METHODS.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>

          <Select
            allowClear
            placeholder="Trạng thái đơn"
            style={{ width: 220 }}
            value={status}
            onChange={setStatus}
          >
            {ORDER_STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>

          <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
            Làm mới
          </Button>
        </Space>

        <Table
          loading={loading}
          columns={columns}
          dataSource={orders}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setLimit(ps);
            },
            showTotal: (t) => `Tổng ${t} đơn`
          }}
        />
      </Card>
    </AdminLayout>
  );
};

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, Card, Button, Input, Space, Typography, Dropdown, Modal, Form, Select, Row, Col, Statistic
} from 'antd';
import {
  SearchOutlined, PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import AdminLayout from '../../../components/layout/adminLayout/AdminLayout';

const { Title, Text } = Typography;
const { Option } = Select;

export const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_BASE;

  // Lấy danh sách tài khoản
  const fetchAccounts = async () => {
  try {
    setLoading(true);
    const resp = await axios.get(`${API_BASE}/accounts`, {
      params: {
        query: searchText || undefined,
        current: 1,
        pageSize: 50
      }
    });

    // API trả về: data.results (array)
    const results = resp.data?.data?.results || [];
    const mapped = results.map(item => ({
      id: item._id,
      name: item.name,
      email: item.email,
      role: item.role,
      status: item.isActive ? 'Hoạt động' : 'Tạm khóa',
      joinDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''
    }));

    setUsers(mapped);
  } catch (err) {
    console.error('Fetch accounts error:', err);
    setUsers([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleMenuClick = async (action, record) => {
    switch (action) {
      case 'edit':
  try {
    const resp = await axios.get(`${API_BASE}/accounts/${record.id}`);
    const userData = resp.data.data || resp.data;

    // Map isActive -> status
    form.setFieldsValue({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: userData.isActive ? 'true' : 'false',
    });

    setEditingUser(record);
    setIsModalVisible(true);
  } catch (err) {
    console.error('Fetch account detail error:', err);
  }
  break;

      case 'view':
        try {
          const resp = await axios.get(`${API_BASE}/accounts/${record.id}`);
          Modal.info({
            title: 'Chi tiết tài khoản',
            content: JSON.stringify(resp.data.data || resp.data, null, 2),
            width: 600
          });
        } catch (err) {
          console.error('View account error:', err);
        }
        break;
      case 'delete':
        Modal.confirm({
          title: 'Xác nhận xóa',
          content: `Bạn có chắc chắn muốn xóa người dùng ${record.name}?`,
          okText: 'Xóa',
          cancelText: 'Hủy',
          okType: 'danger',
          onOk: async () => {
            try {
              await axios.delete(`${API_BASE}/accounts/${record.id}`);
              fetchAccounts();
            } catch (err) {
              console.error('Delete account error:', err);
            }
          }
        });
        break;
    }
  };

  const getMenuItems = (record) => [
    { key: 'view', label: 'Xem chi tiết', icon: <EyeOutlined />, onClick: () => handleMenuClick('view', record) },
    { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined />, onClick: () => handleMenuClick('edit', record) },
    { type: 'divider' },
    { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true, onClick: () => handleMenuClick('delete', record) }
  ];

  const handleModalOk = async () => {
  try {
    const values = await form.validateFields();

    // Map status string -> boolean cho backend
    const payload = {
      name: values.name,
      role: values.role,
      isActive: values.status === 'true'
    };

    if (!editingUser) {
      payload.password = values.password;
    }

    if (editingUser) {
      await axios.put(`${API_BASE}/accounts/${editingUser.id}`, payload);
    } else {
      await axios.post(`${API_BASE}/accounts`, payload);
    }

    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
    fetchAccounts();
  } catch (err) {
    console.error('Save account error:', err);
  }
};

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  const columns = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
          <Text style={{ fontSize: 13 }}>{date}</Text>
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Dropdown menu={{ items: getMenuItems(record) }} placement="bottomRight" trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  return (
    <AdminLayout>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Tìm kiếm..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={fetchAccounts}
          />
        </Space>
        <Table
  loading={loading}
  rowSelection={rowSelection}
  columns={columns}
  dataSource={users}
  rowKey="id"
/>


      </Card>

      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select>
              <Option value="ADMIN">Admin</Option>
              <Option value="USERS">User</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select>
              <Option value="true">Hoạt động</Option>
              <Option value="false">Tạm khóa</Option>
            </Select>
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </AdminLayout>
  );
};

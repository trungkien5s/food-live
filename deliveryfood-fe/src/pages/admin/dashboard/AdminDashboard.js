import React from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Space, Avatar, List, Tag } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import AdminLayout from '../../../components/layout/adminLayout/AdminLayout';

const { Title, Text } = Typography;

export const AdminDashboard = () => {
  // Mock data
  const stats = [
    {
      title: 'Tổng người dùng',
      value: 2847,
      precision: 0,
      valueStyle: { color: '#3f8600' },
      prefix: <ArrowUpOutlined />,
      suffix: <UserOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: 'Đơn hàng hôm nay',
      value: 187,
      precision: 0,
      valueStyle: { color: '#3f8600' },
      prefix: <ArrowUpOutlined />,
      suffix: <ShoppingCartOutlined style={{ color: '#52c41a' }} />,
    },
    {
      title: 'Doanh thu tháng',
      value: 125680000,
      precision: 0,
      valueStyle: { color: '#3f8600' },
      prefix: <ArrowUpOutlined />,
      suffix: '₫',
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: 87.5,
      precision: 1,
      valueStyle: { color: '#cf1322' },
      prefix: <ArrowDownOutlined />,
      suffix: '%',
    },
  ];

  const recentOrders = [
    { id: '#2024001', customer: 'Nguyễn Văn A', amount: '125,000₫', status: 'completed' },
    { id: '#2024002', customer: 'Trần Thị B', amount: '89,000₫', status: 'pending' },
    { id: '#2024003', customer: 'Lê Văn C', amount: '156,000₫', status: 'processing' },
    { id: '#2024004', customer: 'Phạm Thị D', amount: '203,000₫', status: 'completed' },
    { id: '#2024005', customer: 'Hoàng Văn E', amount: '167,000₫', status: 'cancelled' },
  ];

  const getStatusColor = (status) => {
    const colors = {
      completed: 'success',
      pending: 'warning',
      processing: 'processing',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      completed: 'Hoàn thành',
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      cancelled: 'Đã hủy',
    };
    return texts[status] || status;
  };

  return (
    <AdminLayout>
      <div style={{ padding: 0 }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#001529' }}>
            Chào mừng trở lại!
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: 16 }}>
            Tổng quan về hoạt động hệ thống hôm nay
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: '1px solid #e8e8e8',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Statistic
                  title={
                    <Text style={{ fontSize: 14, color: '#8c8c8c', fontWeight: 500 }}>
                      {stat.title}
                    </Text>
                  }
                  value={stat.value}
                  precision={stat.precision}
                  valueStyle={{ ...stat.valueStyle, fontSize: 24, fontWeight: 600 }}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          {/* Recent Orders */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <ShoppingCartOutlined style={{ color: '#1890ff' }} />
                  <span>Đơn hàng gần đây</span>
                </Space>
              }
              extra={<a href="#" style={{ color: '#1890ff' }}>Xem tất cả</a>}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <List
                itemLayout="horizontal"
                dataSource={recentOrders}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tag color={getStatusColor(item.status)} key="status">
                        {getStatusText(item.status)}
                      </Tag>
                    ]}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={40}
                          style={{ backgroundColor: '#f56a00' }}
                        >
                          {item.customer.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>{item.id}</Text>
                          <Text strong style={{ color: '#52c41a' }}>{item.amount}</Text>
                        </div>
                      }
                      description={item.customer}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Performance Overview */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>Hiệu suất</span>
                </Space>
              }
              style={{ borderRadius: 12, height: '100%' }}
            >
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Đơn hàng thành công</Text>
                  <Text strong>87%</Text>
                </div>
                <Progress percent={87} status="active" strokeColor="#52c41a" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Khách hàng hài lòng</Text>
                  <Text strong>93%</Text>
                </div>
                <Progress percent={93} status="active" strokeColor="#1890ff" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Thời gian phản hồi</Text>
                  <Text strong>78%</Text>
                </div>
                <Progress percent={78} status="active" strokeColor="#faad14" />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
};
// src/components/layout/Footer.jsx
import { Link } from "react-router-dom";
import {
  Layout, Row, Col, Typography, Space, Button, Input, Divider,
} from "antd";
import {
  FacebookFilled, InstagramFilled, TwitterSquareFilled,
  MailOutlined, PhoneOutlined, EnvironmentOutlined,
} from "@ant-design/icons";

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

export default function Footer() {
  const onSubscribe = (value) => {
    if (!value) return;
    // TODO: message.success("Đã đăng ký nhận tin!");
  };

  return (
    <AntFooter className="bg-gray-100 p-0">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Row gutter={[32, 32]}>
          {/* Company */}
          <Col xs={24} md={12} lg={6}>
            <Space direction="vertical" size={12}>
              <Title level={3} style={{ margin: 0, color: "#15803d" }}>FoodLive</Title>
              <Text type="secondary">
                Mang đến trải nghiệm ẩm thực tươi ngon, chất lượng với giao hàng nhanh chóng.
              </Text>
              <Space size="middle">
                <a href="#" aria-label="Facebook"><FacebookFilled style={{ fontSize: 20, color: "#16a34a" }} /></a>
                <a href="#" aria-label="Instagram"><InstagramFilled style={{ fontSize: 20, color: "#16a34a" }} /></a>
                <a href="#" aria-label="Twitter/X"><TwitterSquareFilled style={{ fontSize: 20, color: "#16a34a" }} /></a>
              </Space>
            </Space>
          </Col>

          {/* Quick links */}
          <Col xs={12} md={6} lg={6}>
            <Title level={4} style={{ color: "#15803d" }}>Liên kết nhanh</Title>
            <Space direction="vertical" size={8}>
              <Link to="/">Trang chủ</Link>
              <Link to="/menu">Thực đơn</Link>
              <Link to="/about">Về chúng tôi</Link>
              <Link to="/news">Tin tức</Link>
              <Link to="/coupons">Khuyến mãi</Link>
            </Space>
          </Col>

          {/* Customer service */}
          <Col xs={12} md={6} lg={6}>
            <Title level={4} style={{ color: "#15803d" }}>Hỗ trợ khách hàng</Title>
            <Space direction="vertical" size={8}>
              <a href="#">Hướng dẫn đặt hàng</a>
              <a href="#">Chính sách giao hàng</a>
              <a href="#">Chính sách đổi trả</a>
              <a href="#">Câu hỏi thường gặp</a>
            </Space>
          </Col>

          {/* Contact + newsletter */}
          <Col xs={24} md={12} lg={6}>
            <Title level={4} style={{ color: "#15803d" }}>Thông tin liên hệ</Title>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space><EnvironmentOutlined style={{ color: "#16a34a" }} /><Text>Hà Nội</Text></Space>
              <Space><PhoneOutlined style={{ color: "#16a34a" }} /><Text>0376 940 811</Text></Space>
              <Space><MailOutlined style={{ color: "#16a34a" }} /><Text>kiendev@foodlive.vn</Text></Space>

              <Divider style={{ margin: "12px 0" }} />

              <Text strong>Đăng ký nhận tin</Text>
              <Input.Search
                placeholder="Email của bạn"
                enterButton="Gửi"
                onSearch={onSubscribe}
                allowClear
              />
            </Space>
          </Col>
        </Row>
      </div>

      {/* Bottom bar */}
      <div className="bg-green-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md="auto">
              <Text style={{ color: "#fff" }}>
                © 2025 FoodLive. Tất cả quyền được bảo lưu.
              </Text>
            </Col>
            <Col xs={24} md="auto">
              <Space size="large" wrap>
                <a href="#" className="text-white">Điều khoản dịch vụ</a>
                <a href="#" className="text-white">Chính sách bảo mật</a>
                <a href="#" className="text-white">Cookie Policy</a>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </AntFooter>
  );
}

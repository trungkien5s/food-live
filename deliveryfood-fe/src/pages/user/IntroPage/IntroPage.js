import React from 'react';
import { Card, Row, Col, Typography, Space, Divider, Grid } from 'antd';
import { 
  ThunderboltOutlined, 
  SafetyOutlined, 
  StarOutlined, 
  ClockCircleOutlined,
  ShoppingOutlined,
  CustomerServiceOutlined,
  RocketOutlined,
  TeamOutlined,
  GlobalOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import Layout from "../../../components/layout/Layout";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

export const IntroPage = () => {
  const screens = useBreakpoint();
  
  const companyInfo = [
    {
      icon: <TeamOutlined className="text-4xl text-green-500" />,
      number: "50+",
      label: "Nhân viên"
    },
    {
      icon: <ShoppingOutlined className="text-4xl text-green-500" />,
      number: "1000+",
      label: "Đối tác nhà hàng"
    },
    {
      icon: <GlobalOutlined className="text-4xl text-green-500" />,
      number: "10+",
      label: "Thành phố"
    },
    {
      icon: <TrophyOutlined className="text-4xl text-green-500" />,
      number: "5+",
      label: "Năm kinh nghiệm"
    }
  ];

  const services = [
    {
      icon: <ThunderboltOutlined />,
      title: "Giao Hàng Siêu Tốc",
      description: "Cam kết giao hàng trong vòng 30 phút với đội ngũ shipper chuyên nghiệp, được đào tạo bài bản"
    },
    {
      icon: <SafetyOutlined />,
      title: "Đảm Bảo An Toàn",
      description: "Tuân thủ nghiêm ngặt các tiêu chuẩn vệ sinh an toàn thực phẩm, đóng gói kín và bảo quản đúng nhiệt độ"
    },
    {
      icon: <StarOutlined />,
      title: "Chất Lượng Hàng Đầu",
      description: "Hợp tác với các nhà hàng uy tín, được kiểm duyệt kỹ lưỡng về chất lượng món ăn và dịch vụ"
    },
    {
      icon: <CustomerServiceOutlined />,
      title: "Hỗ Trợ Tận Tâm",
      description: "Đội ngũ chăm sóc khách hàng chuyên nghiệp, sẵn sàng hỗ trợ 24/7 qua nhiều kênh khác nhau"
    },
    {
      icon: <ClockCircleOutlined />,
      title: "Tiết Kiệm Thời Gian",
      description: "Đặt hàng nhanh chóng chỉ với vài thao tác, theo dõi đơn hàng real-time trên ứng dụng"
    },
    {
      icon: <RocketOutlined />,
      title: "Công Nghệ Hiện Đại",
      description: "Ứng dụng được xây dựng trên nền tảng công nghệ tiên tiến, giao diện thân thiện và dễ sử dụng"
    }
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: screens.xs ? "16px" : "24px" }}>
        
        {/* Hero Banner */}
        <div 
          style={{
            position: 'relative',
            height: 384,
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 16,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            padding: screens.xs ? "24px" : "48px"
          }}
        >
          <div>
            <Title level={1} style={{ color: 'white', marginBottom: 16 }}>
              Chúng tôi là <span style={{ color: '#52c41a' }}>FoodLive</span>
            </Title>
            <Title level={3} style={{ color: 'white', fontWeight: 'normal', margin: 0 }}>
              Đối tác cung cấp dịch vụ giao đồ ăn hàng đầu tại Việt Nam
            </Title>
          </div>
        </div>

        {/* Company Introduction */}
        <div style={{ marginBottom: 24 }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <div 
                style={{
                  height: 384,
                  backgroundImage: 'url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>VỀ CHÚNG TÔI</Text>
                  <Title level={2} style={{ marginTop: 8, marginBottom: 16 }}>
                    FoodLive - Kết nối bữa ngon
                  </Title>
                </div>
                
                <Paragraph style={{ fontSize: 16, color: '#262626', lineHeight: 1.8 }}>
                  <strong>Công ty TNHH FoodLive</strong> là một trong những công ty Công nghệ hàng đầu tại Việt Nam, 
                  chuyên cung cấp dịch vụ giao đồ ăn trực tuyến và giải pháp công nghệ cho ngành F&B. 
                  Thấu hiểu sứ mệnh kết nối người dùng với những bữa ăn ngon, chất lượng và tiện lợi, 
                  FoodLive luôn nỗ lực tạo ra những đóng góp tích cực cho sự phát triển của ngành 
                  công nghệ ẩm thực Việt Nam.
                </Paragraph>

                <Paragraph style={{ fontSize: 16, color: '#262626', lineHeight: 1.8 }}>
                  Với nhiều kinh nghiệm trong việc xây dựng nền tảng công nghệ, phát triển ứng dụng di động, 
                  quản lý logistics và vận hành hệ thống giao hàng quy mô lớn, chúng tôi tự tin với vai trò 
                  và vị thế của mình trong lĩnh vực cung cấp dịch vụ giao đồ ăn. Những thành tựu FoodLive 
                  đạt được đều là nhờ sự chuyên nghiệp trong cách vận hành của ban lãnh đạo, sự tận tâm cống hiến 
                  của đội ngũ nhân viên, và sự tin tưởng ủng hộ của Quý khách hàng và Quý đối tác.
                </Paragraph>

                <Paragraph style={{ fontSize: 16, color: '#262626', lineHeight: 1.8 }}>
                  Với đội ngũ nhân viên trẻ, năng động và am hiểu công nghệ, FoodLive luôn lấy chất lượng 
                  và sự hài lòng của khách hàng làm định hướng phát triển. Chúng tôi luôn nỗ lực thấu hiểu và 
                  đáp ứng mọi nhu cầu của khách hàng từ những chi tiết nhỏ nhất. Đến với FoodLive, khách hàng 
                  không chỉ được thưởng thức món ăn ngon từ các nhà hàng uy tín mà còn được trải nghiệm dịch vụ 
                  giao hàng nhanh chóng, chuyên nghiệp và đáng tin cậy.
                </Paragraph>

                <Paragraph style={{ fontSize: 16, color: '#262626', lineHeight: 1.8 }}>
                  FoodLive kỳ vọng sẽ trở thành đối tác đồng hành tin cậy của mọi người dùng và nhà hàng 
                  tại Việt Nam, góp phần nâng cao trải nghiệm ẩm thực và phát triển nền kinh tế số trong lĩnh vực F&B.
                </Paragraph>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Company Scale */}
        <Card style={{ marginBottom: 24, background: '#fafafa', border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>QUY MÔ CÔNG TY</Text>
            <Title level={2} style={{ marginTop: 8 }}>
              Quy mô của <span style={{ color: '#52c41a' }}>FoodLive</span>
            </Title>
          </div>

          <Paragraph style={{ fontSize: 16, color: '#262626', textAlign: 'center', maxWidth: 900, margin: '0 auto 48px', lineHeight: 1.8 }}>
            Chúng tôi cung cấp nền tảng công nghệ hiện đại với đội ngũ chuyên gia giàu kinh nghiệm trong 
            phát triển ứng dụng di động, quản lý logistics, xử lý thanh toán điện tử và vận hành hệ thống 
            giao hàng quy mô lớn. Đội ngũ của FoodLive thành thạo trong việc tối ưu hóa trải nghiệm 
            người dùng và mở rộng mạng lưới đối tác nhà hàng trên khắp cả nước.
          </Paragraph>

          <Row gutter={[32, 32]} justify="center">
            {companyInfo.map((item, index) => (
              <Col xs={12} sm={12} lg={6} key={index}>
                <Card style={{ textAlign: 'center', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%' }} hoverable>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {item.icon}
                    <Title level={2} style={{ marginBottom: 0, color: '#52c41a' }}>
                      {item.number}
                    </Title>
                    <Text style={{ color: '#8c8c8c', fontSize: 16 }}>{item.label}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Services Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>DỊCH VỤ CỦA CHÚNG TÔI</Text>
            <Title level={2} style={{ marginTop: 8 }}>
              Cam kết mang đến trải nghiệm tốt nhất
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            {services.map((service, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card 
                  hoverable
                  style={{ 
                    height: '100%', 
                    border: '1px solid #d9d9d9',
                    transition: 'all 0.3s'
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ 
                      width: 56, 
                      height: 56, 
                      background: '#f6ffed', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {React.cloneElement(service.icon, { 
                        style: { fontSize: 24, color: '#52c41a' }
                      })}
                    </div>
                    <Title level={4} style={{ marginBottom: 8 }}>
                      {service.title}
                    </Title>
                    <Paragraph style={{ color: '#595959', marginBottom: 0, lineHeight: 1.8 }}>
                      {service.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Company Information */}
        <Card style={{ background: '#fafafa', border: 'none' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
            Thông tin công ty
          </Title>

          <Row gutter={[48, 48]}>
            <Col xs={24} lg={12}>
              <Card style={{ height: '100%', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Title level={4} style={{ marginBottom: 16, color: '#52c41a' }}>
                    THÔNG TIN CÔNG TY
                  </Title>
                  
                  <div>
                    <Text strong style={{ color: '#262626' }}>Tên công ty:</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959' }}>Công ty TNHH FoodLive</Paragraph>
                  </div>

                  <div>
                    <Text strong style={{ color: '#262626' }}>Lĩnh vực hoạt động:</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959' }}>
                      Cung cấp dịch vụ giao đồ ăn trực tuyến và giải pháp công nghệ cho ngành F&B
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong style={{ color: '#262626' }}>Trụ sở chính:</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959' }}>
                      <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      Tầng 10, Toà nhà Việt Á Tower, Số 9 phố Duy Tân, Cầu Giấy, Hà Nội
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong style={{ color: '#262626' }}>Tổng Giám đốc:</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959' }}>Nguyễn Văn A</Paragraph>
                  </div>

                  <Divider style={{ margin: '16px 0' }} />

                  <div>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div>
                        <PhoneOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                        <Text style={{ color: '#262626' }}>Điện thoại: </Text>
                        <Text strong style={{ color: '#262626' }}>1900-xxxx</Text>
                      </div>
                      <div>
                        <MailOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                        <Text style={{ color: '#262626' }}>Email: </Text>
                        <Text strong style={{ color: '#262626' }}>info@FoodLive.vn</Text>
                      </div>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card style={{ height: '100%', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Title level={4} style={{ marginBottom: 16, color: '#52c41a' }}>
                    VĂN PHÒNG ĐẠI DIỆN
                  </Title>

                  <div>
                    <Text strong style={{ color: '#262626', fontSize: 16 }}>VP Đại diện miền Bắc</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959', marginTop: 8 }}>
                      <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      Tầng 10, Toà nhà Việt Á Tower, Số 9 phố Duy Tân, Cầu Giấy, Hà Nội
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 0, color: '#595959' }}>
                      <PhoneOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      024-xxxx-xxxx
                    </Paragraph>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <Text strong style={{ color: '#262626', fontSize: 16 }}>VP Đại diện miền Nam</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959', marginTop: 8 }}>
                      <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      Tầng 5, Toà nhà ABC, Số 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 0, color: '#595959' }}>
                      <PhoneOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      028-xxxx-xxxx
                    </Paragraph>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />

                  <div>
                    <Text strong style={{ color: '#262626', fontSize: 16 }}>VP Đại diện miền Trung</Text>
                    <Paragraph style={{ marginBottom: 8, color: '#595959', marginTop: 8 }}>
                      <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      Tầng 3, Toà nhà XYZ, Số 456 Trần Phú, Quận Hải Châu, TP. Đà Nẵng
                    </Paragraph>
                    <Paragraph style={{ marginBottom: 0, color: '#595959' }}>
                      <PhoneOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                      0236-xxxx-xxxx
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

      </div>
    </Layout>
  );
}

export default IntroPage;
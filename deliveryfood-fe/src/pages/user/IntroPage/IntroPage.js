import React from 'react';
import { Button, Card, Row, Col, Typography, Space, Divider } from 'antd';
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

export const IntroPage = () => {
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
      {/* Hero Banner */}
      <div 
        className="relative h-96 bg-cover bg-center flex items-center"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-6xl mx-auto px-6 text-white">
          <Title level={1} className="!text-white !mb-4">
            Chúng tôi là <span className="text-green-400">FoodLive</span>
          </Title>
          <Title level={3} className="!text-white !font-normal">
            Đối tác cung cấp dịch vụ giao đồ ăn hàng đầu tại Việt Nam
          </Title>
        </div>
      </div>

      {/* Company Introduction */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={12}>
            <div 
              className="h-96 bg-cover bg-center rounded-lg shadow-lg"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <Text className="text-green-500 text-lg font-semibold">VỀ CHÚNG TÔI</Text>
                <Title level={2} className="!mt-2 !mb-4">
                  FoodLive - Kết nối bữa ngon
                </Title>
              </div>
              
              <Paragraph className="text-base text-gray-700 leading-relaxed">
                <strong>Công ty TNHH FoodLive</strong> là một trong những công ty Công nghệ hàng đầu tại Việt Nam, 
                chuyên cung cấp dịch vụ giao đồ ăn trực tuyến và giải pháp công nghệ cho ngành F&B. 
                Thấu hiểu sứ mệnh kết nối người dùng với những bữa ăn ngon, chất lượng và tiện lợi, 
                FoodLive luôn nỗ lực tạo ra những đóng góp tích cực cho sự phát triển của ngành 
                công nghệ ẩm thực Việt Nam.
              </Paragraph>

              <Paragraph className="text-base text-gray-700 leading-relaxed">
                Với nhiều kinh nghiệm trong việc xây dựng nền tảng công nghệ, phát triển ứng dụng di động, 
                quản lý logistics và vận hành hệ thống giao hàng quy mô lớn, chúng tôi tự tin với vai trò 
                và vị thế của mình trong lĩnh vực cung cấp dịch vụ giao đồ ăn. Những thành tựu FoodLive 
                đạt được đều là nhờ sự chuyên nghiệp trong cách vận hành của ban lãnh đạo, sự tận tâm cống hiến 
                của đội ngũ nhân viên, và sự tin tưởng ủng hộ của Quý khách hàng và Quý đối tác.
              </Paragraph>

              <Paragraph className="text-base text-gray-700 leading-relaxed">
                Với đội ngũ nhân viên trẻ, năng động và am hiểu công nghệ, FoodLive luôn lấy chất lượng 
                và sự hài lòng của khách hàng làm định hướng phát triển. Chúng tôi luôn nỗ lực thấu hiểu và 
                đáp ứng mọi nhu cầu của khách hàng từ những chi tiết nhỏ nhất. Đến với FoodLive, khách hàng 
                không chỉ được thưởng thức món ăn ngon từ các nhà hàng uy tín mà còn được trải nghiệm dịch vụ 
                giao hàng nhanh chóng, chuyên nghiệp và đáng tin cậy.
              </Paragraph>

              <Paragraph className="text-base text-gray-700 leading-relaxed">
                FoodLive kỳ vọng sẽ trở thành đối tác đồng hành tin cậy của mọi người dùng và nhà hàng 
                tại Việt Nam, góp phần nâng cao trải nghiệm ẩm thực và phát triển nền kinh tế số trong lĩnh vực F&B.
              </Paragraph>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Company Scale */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Text className="text-green-500 text-lg font-semibold">QUY MÔ CÔNG TY</Text>
            <Title level={2} className="!mt-2">
              Quy mô của <span className="text-green-500">FoodLive</span>
            </Title>
          </div>

          <Paragraph className="text-base text-gray-700 text-center max-w-4xl mx-auto mb-12 leading-relaxed">
            Chúng tôi cung cấp nền tảng công nghệ hiện đại với đội ngũ chuyên gia giàu kinh nghiệm trong 
            phát triển ứng dụng di động, quản lý logistics, xử lý thanh toán điện tử và vận hành hệ thống 
            giao hàng quy mô lớn. Đội ngũ của FoodLive thành thạo trong việc tối ưu hóa trải nghiệm 
            người dùng và mở rộng mạng lưới đối tác nhà hàng trên khắp cả nước.
          </Paragraph>

          <Row gutter={[32, 32]} justify="center">
            {companyInfo.map((item, index) => (
              <Col xs={12} sm={12} lg={6} key={index}>
                <Card className="text-center border-0 shadow-md hover:shadow-xl transition-shadow h-full">
                  <Space direction="vertical" size="middle" className="w-full">
                    {item.icon}
                    <Title level={2} className="!mb-0 text-green-500">
                      {item.number}
                    </Title>
                    <Text className="text-gray-600 text-base">{item.label}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <Text className="text-green-500 text-lg font-semibold">DỊCH VỤ CỦA CHÚNG TÔI</Text>
            <Title level={2} className="!mt-2">
              Cam kết mang đến trải nghiệm tốt nhất
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            {services.map((service, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card 
                  className="h-full border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all"
                  bodyStyle={{ padding: '24px' }}
                >
                  <Space direction="vertical" size="middle" className="w-full">
                    <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                      {React.cloneElement(service.icon, { 
                        className: 'text-2xl text-green-500' 
                      })}
                    </div>
                    <Title level={4} className="!mb-2">
                      {service.title}
                    </Title>
                    <Paragraph className="text-gray-600 !mb-0 leading-relaxed">
                      {service.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Company Information */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <Title level={2} className="text-center !mb-12">
            Thông tin công ty
          </Title>

          <Row gutter={[48, 48]}>
            <Col xs={24} lg={12}>
              <Card className="h-full border-0 shadow-md">
                <Space direction="vertical" size="large" className="w-full">
                  <Title level={4} className="!mb-4 text-green-500">
                    THÔNG TIN CÔNG TY
                  </Title>
                  
                  <div>
                    <Text strong className="text-gray-700">Tên công ty:</Text>
                    <Paragraph className="!mb-2 text-gray-600">Công ty TNHH FoodLive</Paragraph>
                  </div>

                  <div>
                    <Text strong className="text-gray-700">Lĩnh vực hoạt động:</Text>
                    <Paragraph className="!mb-2 text-gray-600">
                      Cung cấp dịch vụ giao đồ ăn trực tuyến và giải pháp công nghệ cho ngành F&B
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong className="text-gray-700">Trụ sở chính:</Text>
                    <Paragraph className="!mb-2 text-gray-600">
                      <EnvironmentOutlined className="mr-2 text-green-500" />
                      Tầng 10, Toà nhà Việt Á Tower, Số 9 phố Duy Tân, Cầu Giấy, Hà Nội
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong className="text-gray-700">Tổng Giám đốc:</Text>
                    <Paragraph className="!mb-2 text-gray-600">Nguyễn Văn A</Paragraph>
                  </div>

                  <Divider className="my-4" />

                  <div>
                    <Space direction="vertical" size="small" className="w-full">
                      <div>
                        <PhoneOutlined className="mr-2 text-green-500" />
                        <Text className="text-gray-700">Điện thoại: </Text>
                        <Text strong className="text-gray-900">1900-xxxx</Text>
                      </div>
                      <div>
                        <MailOutlined className="mr-2 text-green-500" />
                        <Text className="text-gray-700">Email: </Text>
                        <Text strong className="text-gray-900">info@FoodLive.vn</Text>
                      </div>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="h-full border-0 shadow-md">
                <Space direction="vertical" size="large" className="w-full">
                  <Title level={4} className="!mb-4 text-green-500">
                    VĂN PHÒNG ĐẠI DIỆN
                  </Title>

                  <div>
                    <Text strong className="text-gray-700 text-base">VP Đại diện miền Bắc</Text>
                    <Paragraph className="!mb-2 text-gray-600 mt-2">
                      <EnvironmentOutlined className="mr-2 text-green-500" />
                      Tầng 10, Toà nhà Việt Á Tower, Số 9 phố Duy Tân, Cầu Giấy, Hà Nội
                    </Paragraph>
                    <Paragraph className="!mb-0 text-gray-600">
                      <PhoneOutlined className="mr-2 text-green-500" />
                      024-xxxx-xxxx
                    </Paragraph>
                  </div>

                  <Divider className="my-2" />

                  <div>
                    <Text strong className="text-gray-700 text-base">VP Đại diện miền Nam</Text>
                    <Paragraph className="!mb-2 text-gray-600 mt-2">
                      <EnvironmentOutlined className="mr-2 text-green-500" />
                      Tầng 5, Toà nhà ABC, Số 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
                    </Paragraph>
                    <Paragraph className="!mb-0 text-gray-600">
                      <PhoneOutlined className="mr-2 text-green-500" />
                      028-xxxx-xxxx
                    </Paragraph>
                  </div>

                  <Divider className="my-2" />

                  <div>
                    <Text strong className="text-gray-700 text-base">VP Đại diện miền Trung</Text>
                    <Paragraph className="!mb-2 text-gray-600 mt-2">
                      <EnvironmentOutlined className="mr-2 text-green-500" />
                      Tầng 3, Toà nhà XYZ, Số 456 Trần Phú, Quận Hải Châu, TP. Đà Nẵng
                    </Paragraph>
                    <Paragraph className="!mb-0 text-gray-600">
                      <PhoneOutlined className="mr-2 text-green-500" />
                      0236-xxxx-xxxx
                    </Paragraph>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

 
    </Layout>
  );
}

export default IntroPage;
import React, { useMemo } from "react";
import Layout from "../../../components/layout/Layout";
import { Tabs, Collapse, Typography, Space, Input, Tag, Grid } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  SyncOutlined,
  ShopOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const normalizeVN = (str = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const FAQ_DATA = [
  {
    key: "account",
    label: "Tài khoản",
    icon: <UserOutlined />,
    items: [
      {
        q: "Làm thế nào để tạo tài khoản FoodLive?",
        a: (
          <>
            <Paragraph>
              Bạn chỉ cần số điện thoại/email hợp lệ. Sau khi nhập số điện thoại, hệ thống sẽ gửi mã OTP qua SMS để xác
              minh. Hoàn tất thông tin cơ bản là có thể đặt món ngay.
            </Paragraph>
          </>
        ),
        tags: ["OTP", "Đăng ký"],
      },
      {
        q: "Tôi không nhận được OTP thì phải làm sao?",
        a: (
          <Paragraph>
            Hãy kiểm tra lại sóng điện thoại, chặn tin nhắn rác, hoặc thử "Gửi lại OTP" sau 60 giây. Nếu vẫn không nhận
            được, hãy thử đổi sang đăng nhập bằng email (nếu có) hoặc liên hệ hỗ trợ trong mục "Trợ giúp".
          </Paragraph>
        ),
        tags: ["OTP", "Sự cố"],
      },
      {
        q: "Tôi muốn đổi số điện thoại/email hoặc mật khẩu?",
        a: (
          <Paragraph>
            Vào <Text strong>Hồ sơ &gt; Cài đặt</Text> để cập nhật thông tin. Với các thay đổi quan trọng (đổi số điện
            thoại/email), hệ thống có thể yêu cầu xác minh lại bằng OTP để đảm bảo an toàn.
          </Paragraph>
        ),
        tags: ["Bảo mật"],
      },
    ],
  },
  {
    key: "order",
    label: "Đặt món",
    icon: <ShoppingCartOutlined />,
    items: [
      {
        q: "Làm sao để đặt món trên FoodLive?",
        a: (
          <Paragraph>
            Chọn nhà hàng &gt; thêm món vào giỏ &gt; chọn địa chỉ giao &gt; chọn phương thức thanh toán &gt; xác nhận
            đơn. Bạn có thể ghi chú món (ít đá/ít đường/không hành…) trước khi đặt.
          </Paragraph>
        ),
        tags: ["Giỏ hàng", "Ghi chú"],
      },
      {
        q: "Tại sao tôi không đặt được đơn?",
        a: (
          <Paragraph>
            Một số lý do thường gặp: nhà hàng tạm đóng, ngoài giờ hoạt động, địa chỉ giao nằm ngoài phạm vi phục vụ, món
            đã hết, hoặc giỏ hàng không đạt giá trị tối thiểu. Hãy thử đổi địa chỉ, đổi nhà hàng hoặc đặt lại sau.
          </Paragraph>
        ),
        tags: ["Nhà hàng", "Phạm vi"],
      },
      {
        q: "Tôi có thể chỉnh sửa đơn sau khi đặt không?",
        a: (
          <Paragraph>
            Tùy trạng thái đơn. Nếu đơn <Text strong>chưa được nhà hàng xác nhận</Text>, bạn có thể hủy và đặt lại. Khi
            đơn đã vào trạng thái <Text strong>Đang chuẩn bị</Text> trở đi, việc chỉnh sửa thường không khả dụng để tránh
            sai sót.
          </Paragraph>
        ),
        tags: ["Trạng thái"],
      },
      {
        q: "Trạng thái đơn hàng có ý nghĩa gì?",
        a: (
          <Paragraph>
            Ví dụ: <Tag>Pending</Tag> (mới tạo) → <Tag>Confirmed</Tag> (nhà hàng xác nhận) →{" "}
            <Tag>Preparing</Tag> (đang chuẩn bị) → <Tag>Ready</Tag> (sẵn sàng) → <Tag>Assigned</Tag> (gán shipper) →{" "}
            <Tag>Picking up</Tag> → <Tag>Delivering</Tag> → <Tag>Delivered</Tag>. Nếu <Tag color="red">Cancelled</Tag>{" "}
            là đơn đã hủy.
          </Paragraph>
        ),
        tags: ["Workflow"],
      },
    ],
  },
  {
    key: "payment",
    label: "Thanh toán",
    icon: <CreditCardOutlined />,
    items: [
      {
        q: "FoodLive hỗ trợ những phương thức thanh toán nào?",
        a: (
          <Paragraph>
            Tùy cấu hình hệ thống của bạn, thường sẽ có <Text strong>Tiền mặt</Text> và <Text strong>Thẻ/Ví điện tử</Text>
            . Bạn có thể chọn ở bước "Thanh toán" trước khi xác nhận đặt đơn.
          </Paragraph>
        ),
        tags: ["Cash", "Card"],
      },
      {
        q: "Tôi bị trừ tiền nhưng đơn không thành công?",
        a: (
          <Paragraph>
            Trong một số trường hợp cổng thanh toán xử lý chậm, đơn có thể chưa ghi nhận. Hãy kiểm tra lịch sử đơn và
            thông báo thanh toán. Nếu vẫn không thấy đơn, vui lòng gửi ảnh/biên nhận giao dịch trong mục "Trợ giúp" để
            được kiểm tra và hoàn tiền theo quy định.
          </Paragraph>
        ),
        tags: ["Hoàn tiền", "Sự cố"],
      },
      {
        q: "Tôi có thể yêu cầu xuất hóa đơn không?",
        a: (
          <Paragraph>
            Nếu FoodLive có hỗ trợ hóa đơn, bạn có thể bật tùy chọn "Yêu cầu hóa đơn" khi đặt đơn hoặc trong chi tiết đơn
            sau khi hoàn tất. Hóa đơn (nếu có) sẽ được gửi qua email đã đăng ký.
          </Paragraph>
        ),
        tags: ["Hóa đơn"],
      },
    ],
  },
  {
    key: "delivery",
    label: "Giao hàng",
    icon: <EnvironmentOutlined />,
    items: [
      {
        q: "Phí giao hàng được tính như thế nào?",
        a: (
          <Paragraph>
            Phí giao thường dựa trên khoảng cách, khung giờ cao điểm (nếu có), điều kiện thời tiết/đường sá và ưu đãi đang
            áp dụng. Mức phí hiển thị rõ trước khi bạn xác nhận đặt đơn.
          </Paragraph>
        ),
        tags: ["Phí", "Cao điểm"],
      },
      {
        q: "Tôi có thể thay đổi địa chỉ giao sau khi đặt không?",
        a: (
          <Paragraph>
            Nếu đơn chưa có shipper nhận/giao, bạn có thể thử cập nhật địa chỉ trong chi tiết đơn (nếu hệ thống cho phép).
            Khi đơn đã "Đang giao", việc đổi địa chỉ có thể bị giới hạn để đảm bảo lộ trình và phí phát sinh.
          </Paragraph>
        ),
        tags: ["Địa chỉ"],
      },
      {
        q: "Đơn giao trễ hoặc thiếu món thì xử lý thế nào?",
        a: (
          <Paragraph>
            Bạn vào <Text strong>Đơn hàng &gt; Chọn đơn &gt; Trợ giúp</Text>, chọn vấn đề (giao trễ/thiếu món/sai món) và
            gửi mô tả kèm ảnh. Bộ phận hỗ trợ sẽ đối soát với nhà hàng/shipper và xử lý theo chính sách (bù món/hoàn tiền…).
          </Paragraph>
        ),
        tags: ["Khiếu nại", "Bằng chứng"],
      },
    ],
  },
  {
    key: "promo",
    label: "Khuyến mãi",
    icon: <GiftOutlined />,
    items: [
      {
        q: "Tôi không dùng được mã khuyến mãi?",
        a: (
          <Paragraph>
            Mã có thể không áp dụng vì: hết hạn, giới hạn số lượt, không đúng nhà hàng/khung giờ, chưa đạt giá trị tối
            thiểu, hoặc không áp dụng với một số phương thức thanh toán. Hãy kiểm tra điều kiện hiển thị trong mục "Khuyến
            mãi" trước khi đặt.
          </Paragraph>
        ),
        tags: ["Voucher", "Điều kiện"],
      },
      {
        q: "Mã khuyến mãi có được áp dụng cùng phí giao không?",
        a: (
          <Paragraph>
            Tùy loại mã: có mã giảm giá món, có mã giảm phí giao, và có mã giảm tổng hóa đơn. Nếu mã chỉ giảm món thì phí
            giao vẫn giữ nguyên (trừ khi có ưu đãi riêng).
          </Paragraph>
        ),
        tags: ["Phí giao"],
      },
    ],
  },
  {
    key: "refund",
    label: "Hủy đơn & hoàn tiền",
    icon: <SyncOutlined />,
    items: [
      {
        q: "Tôi có thể hủy đơn không?",
        a: (
          <Paragraph>
            Bạn có thể hủy khi đơn còn ở trạng thái <Text strong>mới tạo/chưa xác nhận</Text>. Nếu nhà hàng đã chuẩn bị
            món hoặc shipper đã nhận, việc hủy có thể bị từ chối hoặc phát sinh phí tùy chính sách.
          </Paragraph>
        ),
        tags: ["Hủy đơn"],
      },
      {
        q: "Hoàn tiền mất bao lâu?",
        a: (
          <Paragraph>
            Tùy phương thức thanh toán. Tiền mặt sẽ xử lý theo hướng dẫn hỗ trợ. Với thẻ/ví, thời gian hoàn tiền phụ thuộc
            ngân hàng/cổng thanh toán (thường vài ngày làm việc). Bạn nên lưu biên nhận và mã đơn để tra soát nhanh.
          </Paragraph>
        ),
        tags: ["Thẻ/Ví", "Tra soát"],
      },
    ],
  },
  {
    key: "partner",
    label: "Đối tác nhà hàng",
    icon: <ShopOutlined />,
    items: [
      {
        q: "Tôi muốn đăng ký nhà hàng lên FoodLive?",
        a: (
          <Paragraph>
            Vui lòng chuẩn bị thông tin: tên nhà hàng, địa chỉ, giờ mở cửa, menu & giá, hình ảnh món, giấy tờ liên quan
            (nếu cần). Sau đó gửi yêu cầu ở mục "Hợp tác/Đăng ký đối tác" (hoặc liên hệ hotline/email hỗ trợ của FoodLive).
          </Paragraph>
        ),
        tags: ["Onboarding"],
      },
      {
        q: "Nhà hàng có thể cập nhật menu/giá thế nào?",
        a: (
          <Paragraph>
            Nếu bạn có trang quản trị, nhà hàng có thể cập nhật trực tiếp trong "Ứng dụng/Portal nhà hàng". Nếu chưa có,
            hãy gửi yêu cầu chỉnh sửa menu cho bộ phận hỗ trợ kèm danh sách thay đổi.
          </Paragraph>
        ),
        tags: ["Menu", "Admin"],
      },
    ],
  },
  {
    key: "safety",
    label: "An toàn & hỗ trợ",
    icon: <SafetyOutlined />,
    items: [
      {
        q: "Tôi cần hỗ trợ đơn gấp thì làm sao?",
        a: (
          <Paragraph>
            Vào <Text strong>Đơn hàng &gt; Chọn đơn &gt; Trợ giúp</Text> và chọn đúng vấn đề. Nên gửi kèm ảnh chụp màn hình,
            biên nhận thanh toán, và mô tả ngắn gọn để xử lý nhanh.
          </Paragraph>
        ),
        tags: ["Hỗ trợ"],
      },
      {
        q: "Thông tin cá nhân của tôi được bảo vệ như thế nào?",
        a: (
          <Paragraph>
            FoodLive chỉ sử dụng dữ liệu cần thiết để vận hành (giao hàng, thanh toán, chăm sóc khách hàng). Bạn có thể
            quản lý một số quyền riêng tư trong Cài đặt và liên hệ hỗ trợ nếu cần xóa/điều chỉnh dữ liệu theo chính sách.
          </Paragraph>
        ),
        tags: ["Privacy"],
      },
    ],
  },
];

export const FaqPage = () => {
  const [keyword, setKeyword] = React.useState("");
  const screens = useBreakpoint();

  const tabs = useMemo(() => {
    const keyNorm = normalizeVN(keyword);

    const buildPanels = (items) => {
      const filtered = !keyNorm
        ? items
        : items.filter(({ q, tags }) => {
          const hay = normalizeVN(`${q} ${(tags || []).join(" ")}`);
          return hay.includes(keyNorm);
        });

      return filtered.map((it, idx) => ({
        key: `${idx}`,
        label: (
          <Space size={8} wrap>
            <Text strong>{it.q}</Text>
            {(it.tags || []).slice(0, 3).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </Space>
        ),
        children: <div style={{ paddingTop: 4 }}>{it.a}</div>,
      }));
    };

    return FAQ_DATA.map((cat) => ({
      key: cat.key,
      label: (
        <Space size={8}>
          {cat.icon}
          <span>{cat.label}</span>
        </Space>
      ),
      children: (
        <Collapse
          accordion
          items={buildPanels(cat.items)}
          bordered={false}
          style={{ background: "transparent" }}
        />
      ),
    }));
  }, [keyword]);

  return (
    <Layout>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: screens.xs ? "16px" : "24px" }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              Câu hỏi thường gặp
            </Title>
            <Text type="secondary">
              Tổng hợp các thắc mắc phổ biến khi sử dụng FoodLive: tài khoản, đặt món, thanh toán, giao hàng, khuyến mãi…
            </Text>
          </div>

          <Input
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm câu hỏi (VD: OTP, hoàn tiền...)"
            size="large"
          />

          <div style={{ 
            borderRadius: 12, 
            padding: screens.xs ? 8 : 12, 
            background: "rgba(0,0,0,0.02)" 
          }}>
            <Tabs
              items={tabs}
              tabPosition="top"
              destroyInactiveTabPane
              style={{ background: "transparent" }}
            />
          </div>

          <Text type="secondary" style={{ fontSize: screens.xs ? 12 : 14 }}>
            Không tìm thấy câu trả lời? Vào <Text strong>Trợ giúp</Text> trong ứng dụng FoodLive để gửi yêu cầu hỗ trợ kèm
            ảnh chụp màn hình/biên nhận.
          </Text>
        </Space>
      </div>
    </Layout>
  );
};
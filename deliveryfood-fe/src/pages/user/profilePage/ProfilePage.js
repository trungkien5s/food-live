import React, { useEffect, useState } from "react";
import Layout from "../../../components/layout/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../../redux/store/store";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";
import { logout, setAuthMode, setShowAuthModal } from "../../../redux/store/slices/userSlice";

import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

import {
  ConfigProvider,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Button,
  Form,
  Input,
  Alert,
  Spin,
  Divider,
  Modal,
  message,
  Descriptions,
  Tag,
} from "antd";

const { Title, Text } = Typography;

const API_BASE = process.env.REACT_APP_API_BASE;
const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

// Map role theo chuẩn UPPERCASE từ BE
const ROLE_LABEL = {
  ADMIN: "Quản lý",
  USERS: "Khách hàng",
  SHIPPER: "Shipper",
  STAFF: "Nhân viên",
  OWNER: "Chủ cửa hàng",
};
const ROLE_COLOR = {
  ADMIN: "magenta",
  USERS: "green",
  SHIPPER: "geekblue",
  STAFF: "blue",
  OWNER: "volcano",
};
const toUpper = (v) => String(v ?? "").toUpperCase();

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoggedIn } = useAppSelector((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [role, setRole] = useState("USERS");
  const [active, setActive] = useState(false);

  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const handle401 = () => {
    dispatch(setAuthMode("login"));
    dispatch(setShowAuthModal(true));
  };

  // ====== Fetch profile ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setFetchError("");
        const res = await axios.get(`${API_BASE}/accounts/me`);
        const data = unwrap(res);
        if (!mounted) return;

        form.setFieldsValue({
          name: data?.name ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
          address: data?.address ?? "",
        });

        // Lấy role chuẩn hóa về UPPERCASE
        const apiRole =
          data?.role ??
          (Array.isArray(data?.roles) ? data.roles[0] : undefined) ??
          (data?.isAdmin ? "ADMIN" : undefined);
        setRole(toUpper(apiRole || "USERS"));

        setActive(Boolean(data?.isActive));
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) handle401();
        setFetchError(err?.response?.data?.message || "Không tải được thông tin tài khoản.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== Actions ======
  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        name: values.name?.trim(),
        phone: values.phone?.trim(),
        address: values.address?.trim(),
      };
      const res = await axios.put(`${API_BASE}/accounts/me`, payload);
      const data = unwrap(res);
      form.setFieldsValue({
        name: data?.name ?? values.name,
        phone: data?.phone ?? values.phone,
        address: data?.address ?? values.address,
      });
      message.success("Cập nhật hồ sơ thành công.");
    } catch (err) {
      if (err?.errorFields) return;
      const status = err?.response?.status;
      if (status === 401) handle401();
      message.error(err?.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = await pwdForm.validateFields();
      if (newPassword !== confirmNewPassword) {
        message.error("Xác nhận mật khẩu không khớp.");
        return;
      }
      setPwdSaving(true);
      await axios.put(`${API_BASE}/accounts/change-password`, {
        oldPassword: String(currentPassword ?? ""),
        newPassword: String(newPassword ?? ""),
      });
      message.success("Đổi mật khẩu thành công.");
      pwdForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      const status = err?.response?.status;
      if (status === 401) handle401();
      message.error(err?.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE}/accounts/me`);
      message.success("Tài khoản đã được xoá.");
      dispatch(logout());
      navigate("/");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) handle401();
      message.error(err?.response?.data?.message || "Xoá tài khoản thất bại.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  // ====== Derived ======
  const emailValue = Form.useWatch("email", form);
  const nameValue = Form.useWatch("name", form);

  const roleLabel = ROLE_LABEL[role] || "Khách hàng";
  const roleColor = ROLE_COLOR[role] || "default";

  return (
    <Layout>
      <ConfigProvider
        theme={{
          token: { colorPrimary: "#16a34a", borderRadius: 12 },
          components: {
            Card: { borderRadiusLG: 16 },
            Button: { borderRadius: 10 },
            Input: { borderRadius: 10 },
          },
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Row align="middle" justify="space-between" style={{ marginBottom: 16, gap: 8 }}>
            <Space>
              <Title level={3} style={{ margin: 0 }}>
                Hồ sơ của tôi
              </Title>
            </Space>
          </Row>

          {loading ? (
            <Card>
              <Space align="center">
                <Spin />
                <Text>Đang tải thông tin…</Text>
              </Space>
            </Card>
          ) : fetchError ? (
            <Alert
              type="error"
              showIcon
              message="Lỗi tải dữ liệu"
              description={fetchError}
              style={{ marginBottom: 16 }}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {/* Left: Profile Summary */}
              <Col xs={24} lg={8}>
                <Card>
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Space align="center">
                      <UserIcon />
                      <div>
                        <Title level={5} style={{ marginBottom: 4 }}>
                          {nameValue || "Người dùng"}
                        </Title>
                        <Text type="secondary">{emailValue || "—"}</Text>
                      </div>
                    </Space>

                    <Divider style={{ margin: "8px 0" }} />

                    <Descriptions size="small" column={1} colon={false}>
                      <Descriptions.Item label="Tài khoản">
                        <Tag color={roleColor}>{roleLabel}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        <Text type={active ? "success" : "warning"}>
                          {active ? "Hoạt động" : "Chưa kích hoạt"}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </Card>

                {/* Danger Zone */}
                <Card
                  style={{ marginTop: 16, borderColor: "#fecaca" }}
                  headStyle={{ borderBottom: "none" }}
                  title={
                    <Space align="center">
                      <AlertTriangle size={18} color="#ef4444" />
                      <Text strong style={{ color: "#b91c1c" }}>
                        Khu vực nguy hiểm
                      </Text>
                    </Space>
                  }
                >
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Text type="secondary">
                      Xoá tài khoản sẽ huỷ vĩnh viễn dữ liệu hồ sơ của bạn. Hành động không thể hoàn tác.
                    </Text>
                    <Button danger onClick={() => setDeleteOpen(true)}>
                      Xoá tài khoản
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* Right: Forms */}
              <Col xs={24} lg={16}>
                <Card title="Thông tin tài khoản" extra={<Text type="secondary">Email không thể thay đổi</Text>}>
                  <Form form={form} layout="vertical" requiredMark={false}>
                    <Row gutter={12}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="name"
                          label="Họ tên"
                          rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                        >
                          <Input prefix={<UserIcon size={16} />} placeholder="Nguyễn Văn A" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="email"
                          label="Email"
                          rules={[
                            { required: true, message: "Vui lòng nhập email" },
                            { type: "email", message: "Email không hợp lệ" },
                          ]}
                        >
                          <Input disabled prefix={<Mail size={16} />} placeholder="you@example.com" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="phone" label="Số điện thoại">
                          <Input prefix={<Phone size={16} />} placeholder="0912 345 678" />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item name="address" label="Địa chỉ">
                          <Input
                            prefix={<MapPin size={16} />}
                            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button onClick={() => form.resetFields()}>Làm mới</Button>
                      <Button type="primary" loading={saving} onClick={handleSaveProfile}>
                        Lưu thay đổi
                      </Button>
                    </Space>
                  </Form>
                </Card>

                <Card title="Đổi mật khẩu" style={{ marginTop: 16 }}>
                  <Form form={pwdForm} layout="vertical" requiredMark={false}>
                    <Form.Item
                      name="currentPassword"
                      label="Mật khẩu hiện tại"
                      rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
                    >
                      <Input.Password prefix={<KeyRound size={16} />} placeholder="••••••••" />
                    </Form.Item>
                    <Row gutter={12}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="newPassword"
                          label="Mật khẩu mới"
                          rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới" },
                            { min: 8, message: "Mật khẩu mới phải tối thiểu 8 ký tự" },
                          ]}
                          hasFeedback
                        >
                          <Input.Password prefix={<KeyRound size={16} />} placeholder="Tối thiểu 8 ký tự" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="confirmNewPassword"
                          label="Xác nhận mật khẩu mới"
                          dependencies={["newPassword"]}
                          hasFeedback
                          rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu" },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                                return Promise.reject(new Error("Xác nhận mật khẩu không khớp"));
                              },
                            }),
                          ]}
                        >
                          <Input.Password prefix={<KeyRound size={16} />} placeholder="••••••••" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button loading={pwdSaving} type="primary" onClick={handleChangePassword}>
                        Đổi mật khẩu
                      </Button>
                    </Space>
                  </Form>
                </Card>
              </Col>
            </Row>
          )}

          <Modal
            title={
              <Space>
                <AlertTriangle size={18} color="#ef4444" />
                <Text strong>Xác nhận xoá tài khoản</Text>
              </Space>
            }
            open={deleteOpen}
            onCancel={() => setDeleteOpen(false)}
            okButtonProps={{ danger: true, loading: deleting }}
            okText="Xoá vĩnh viễn"
            cancelText="Huỷ"
            onOk={handleDeleteAccount}
            centered
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                Hành động này <Text strong>không thể hoàn tác</Text>. Tất cả dữ liệu hồ sơ sẽ bị xoá vĩnh viễn.
              </Text>
              <Alert
                type="warning"
                showIcon
                message="Lưu ý"
                description="Nếu bạn còn đơn hàng đang xử lý, hãy hoàn tất trước khi xoá tài khoản."
              />
            </Space>
          </Modal>
        </div>
      </ConfigProvider>
    </Layout>
  );
};

export default ProfilePage;

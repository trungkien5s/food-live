import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setAuthMode, setError, setLoading } from "../../redux/store/slices/userSlice";
import axios from "axios";
import api from "../../api/api";

/* Ant Design */
import {
  Form,
  Input,
  Button,
  Alert,
  Space,
  Divider,
  message,
} from "antd";

/* Icons */
import { FacebookFilled, GoogleOutlined } from "@ant-design/icons";

/* Helpers */
const saveAuthData = (token, user, refreshToken = null) => {
  try {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const expirationTime = user.tokenExpiration ?? Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("tokenExpiration", String(expirationTime));
  } catch (err) {
    console.error("Save auth error:", err);
  }
};

function RegisterFormPage({ form, onTabChange, onClose }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.user);

  const handleRegister = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const { name, email, password, confirmPassword } = await form.validateFields();

      if (password !== confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }

      // Gọi relative path (api instance nên đã có baseURL)
      const payload = { name, email, password };

      const response = await api.post('/auth/register', payload);

      // server có thể trả statusCode trong body, hoặc HTTP status
      const statusCode = response?.data?.statusCode ?? response?.status;

      if (statusCode === 201) {
        const data = response?.data?.data ?? {};
        if (data?._id) {
          // Lưu prefill email để tự điền vào form login
          try { localStorage.setItem("prefill_email", email); } catch (e) { /* ignore */ }

          message.success("Đăng ký thành công! Vui lòng đăng nhập.");
          // Chuyển modal sang login (giữ modal mở, thay đổi tab)
          dispatch(setAuthMode("login"));
          // nếu bạn muốn đóng modal thay vì chuyển tab, uncomment dòng dưới
          // onClose?.();
          return;
        }
      }

      // Nếu không phải 201 hoặc thiếu data._id -> show lỗi
      const serverMsg = response?.data?.message || response?.data?.error;
      throw new Error(serverMsg || "Đăng ký thất bại");

    } catch (err) {
      // Log chi tiết để debug
      console.error("Register error full:", err);
      console.error("Axios response data:", err?.response?.data);

      const serverData = err?.response?.data;
      const msg =
        serverData?.message ||
        serverData?.error ||
        err?.message ||
        "Đã có lỗi xảy ra. Vui lòng thử lại.";

      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSocialLogin = async (provider) => {
    dispatch(setLoading(true));
    try {
      // dùng relative path giống trên
      const res = await api.post('/auth/social', {
        provider: provider.toLowerCase()
      });

      if (![200, 201].includes(res?.data?.statusCode ?? res?.status)) {
        throw new Error(res?.data?.message || "Đăng nhập qua mạng xã hội thất bại");
      }

      const { data } = res.data;
      const { user, access_token, refresh_token } = data || {};

      if (access_token && user) {
        saveAuthData(access_token, user, refresh_token);
        dispatch(login(user));
        message.success(`Đăng nhập ${provider} thành công!`);
        onClose?.();
      } else {
        throw new Error("Đăng nhập qua mạng xã hội thất bại");
      }
    } catch (err) {
      console.error("Social login error:", err, err?.response?.data);
      const serverData = err?.response?.data;
      const msg =
        serverData?.message ||
        serverData?.error ||
        err?.message ||
        "Đăng nhập qua mạng xã hội thất bại";
      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Form form={form} layout="vertical" requiredMark={false}>
      {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} />}

      <Form.Item
        name="name"
        label="Họ và tên"
        rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
      >
        <Input placeholder="Nhập tên" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Vui lòng nhập email" },
          { type: "email", message: "Email không hợp lệ" },
        ]}
      >
        <Input placeholder="you@foodlive.com" />
      </Form.Item>

      <Form.Item
        name="password"
        label="Mật khẩu"
        rules={[
          { required: true, message: "Vui lòng nhập mật khẩu" },
          { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
        ]}
        hasFeedback
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        dependencies={["password"]}
        hasFeedback
        rules={[
          { required: true, message: "Vui lòng xác nhận mật khẩu" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
            },
          }),
        ]}
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>

      <Space direction="vertical" style={{ width: "100%" }}>
        <Button type="primary" block loading={loading} onClick={handleRegister}>
          Đăng ký
        </Button>
      </Space>

      <Divider>Hoặc</Divider>

      <Space.Compact block>
        <Button
          block
          loading={loading}
          icon={<FacebookFilled style={{ color: "#1877f2" }} />}
          onClick={() => handleSocialLogin("Facebook")}
        >
          Facebook
        </Button>
        <Button
          block
          loading={loading}
          danger
          icon={<GoogleOutlined />}
          onClick={() => handleSocialLogin("Google")}
        >
          Google
        </Button>
      </Space.Compact>
    </Form>
  );
}

export default RegisterFormPage;

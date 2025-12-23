import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setError, setLoading } from "../../redux/store/slices/userSlice";
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
import { useNavigate } from "react-router-dom";

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

function LoginFormPage({ form, onTabChange, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const { loading, error } = useSelector((s) => s.user);

  const handleLogin = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      const { email, password } = await form.validateFields(["email", "password"]);
      const response = await api.post(`${process.env.REACT_APP_API_BASE}/auth/login`, {
        username: email,
        password,
      });

      if (![200, 201].includes(response?.data?.statusCode)) {
        throw new Error(response?.data?.message || response?.data?.error || "Đăng nhập thất bại");
      }

      const data = response?.data?.data;
      const { user, access_token, refresh_token } = data || {};

      if (access_token && user) {
        // 1. Lưu dữ liệu auth trước
        saveAuthData(access_token, user, refresh_token);
        
        // 2. Cập nhật Redux state
        dispatch(login(user));
        
        // 3. Debug log để kiểm tra
        console.log("User logged in:", user);
        console.log("User role:", user.role);
        
        // 4. Hiển thị thông báo thành công
        message.success("Đăng nhập thành công!");

        // 5. Đóng modal trước khi navigate (nếu có)
        if (onClose) onClose();
        
        // 6. Điều hướng dựa vào role với delay nhỏ
        setTimeout(() => {
          if (user.role === "ADMIN") {
            console.log("Navigating to admin dashboard...");
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        }, 200); // Tăng delay lên 200ms
        
      } else {
        throw new Error("Phản hồi từ server không hợp lệ");
      }
    } catch (err) {
  console.error("Login error:", err);

  const status = err?.response?.status;
  const serverMsg =
    err?.response?.data?.message ||
    err?.response?.data?.error;

  // Nếu BE trả 401 => show message bạn muốn
  let msg = "Đã có lỗi xảy ra. Vui lòng thử lại.";

  if (status === 401) {
    msg = "Email hoặc mật khẩu không chính xác";
  } else if (serverMsg) {
    // BE có message rõ ràng thì ưu tiên dùng
    msg = Array.isArray(serverMsg) ? serverMsg.join(", ") : serverMsg;
  } else if (err?.message) {
    msg = err.message;
  }

  dispatch(setError(msg));
} finally {
  dispatch(setLoading(false));
}

  };

  const handleSocialLogin = async (provider) => {
    dispatch(setLoading(true));
    try {
      const res = await api.post(`${process.env.REACT_APP_API_BASE}/auth/social`, { 
        provider: provider.toLowerCase() 
      });
      
      if (![200, 201].includes(res?.data?.statusCode)) {
        throw new Error(res?.data?.message || "Đăng nhập qua mạng xã hội thất bại");
      }
      
      const { data } = res.data;
      const { user, access_token, refresh_token } = data || {};
      
      if (access_token && user) {
        saveAuthData(access_token, user, refresh_token);
        dispatch(login(user));
        message.success(`Đăng nhập ${provider} thành công!`);
        
        if (onClose) onClose();
        
        setTimeout(() => {
          if (user.role === "ADMIN") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        }, 100);
      } else {
        throw new Error("Đăng nhập qua mạng xã hội thất bại");
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || "Đăng nhập qua mạng xã hội thất bại";
      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Form form={form} layout="vertical" requiredMark={false}>
      {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} />}
      
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Vui lòng nhập email" },
          { type: "email", message: "Email không hợp lệ" },
        ]}
      >
        <Input placeholder="you@example.com" />
      </Form.Item>
      
      <Form.Item 
        name="password" 
        label="Mật khẩu" 
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
      >
        <Input.Password placeholder="Mật khẩu" />
      </Form.Item>
      
      <Space direction="vertical" style={{ width: "100%" }}>
        <Button type="primary" block loading={loading} onClick={handleLogin}>
          Đăng nhập
        </Button>
        <Button type="link" block onClick={() => onTabChange("forgot")}>
          Quên mật khẩu?
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

export default LoginFormPage;
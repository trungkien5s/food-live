import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthMode, setError, setLoading } from "../../redux/store/slices/userSlice";
import api from "../../api/api";

/* Ant Design */
import {
  Form,
  Input,
  Button,
  Alert,
  Steps,
  Space,
  Divider,
  message,
} from "antd";

function ForgotPasswordFormPage({ 
  form, 
  forgotPasswordStep, 
  setForgotPasswordStep, 
  onTabChange, 
  onClose 
}) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.user);

  const stepIndex = useMemo(
    () => ({ email: 0, verifyCode: 1, newPassword: 2 }[forgotPasswordStep] ?? 0),
    [forgotPasswordStep]
  );

  const handleForgotPassword = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      if (forgotPasswordStep === "email") {
        const { email } = await form.validateFields(["email"]);
        const res = await api.post(`${process.env.REACT_APP_API_BASE}/accounts/password-reset-request`, { 
          email 
        });
        
        if (![200, 201].includes(res?.data?.statusCode)) {
          throw new Error(res?.data?.message || res?.data?.error || "Gửi email đặt lại mật khẩu thất bại");
        }
        
        message.success("Mã xác nhận đã được gửi đến email của bạn.");
        setForgotPasswordStep("verifyCode");
        
      } else if (forgotPasswordStep === "verifyCode") {
        const { email, resetCode } = await form.validateFields(["email", "resetCode"]);
        const res = await api.post(`${process.env.REACT_APP_API_BASE}/accounts/verify-reset-code`, {
          email,
          code: resetCode,
        });
        
        if (![200, 201].includes(res?.data?.statusCode)) {
          throw new Error(res?.data?.message || res?.data?.error || "Mã xác nhận không hợp lệ hoặc đã hết hạn");
        }
        
        message.success("Mã xác nhận hợp lệ! Vui lòng nhập mật khẩu mới.");
        setForgotPasswordStep("newPassword");
        
      } else if (forgotPasswordStep === "newPassword") {
        const { resetCode, newPassword, confirmNewPassword } = await form.validateFields([
          "resetCode",
          "newPassword",
          "confirmNewPassword",
        ]);
        
        if (newPassword !== confirmNewPassword) {
          throw new Error("Mật khẩu xác nhận không khớp");
        }
        
        const res = await api.post(`${process.env.REACT_APP_API_BASE}/accounts/reset-password`, {
          resetCode,
          newPassword,
        });
        
        if (![200, 201].includes(res?.data?.statusCode)) {
          throw new Error(res?.data?.message || res?.data?.error || "Đặt lại mật khẩu thất bại");
        }
        
        message.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        dispatch(setAuthMode("login"));
        setForgotPasswordStep("email");
        
        // Set email to login form
        const loginForm = document.querySelector('[data-testid="login-form"]');
        if (loginForm) {
          // This is a workaround - ideally you'd pass this through props or context
          // form.setFieldsValue({ email: form.getFieldValue("email") });
        }
        
        form.resetFields();
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleBackStep = () => {
    if (forgotPasswordStep === "verifyCode") {
      setForgotPasswordStep("email");
    } else if (forgotPasswordStep === "newPassword") {
      setForgotPasswordStep("verifyCode");
    }
  };

  const getButtonText = () => {
    switch (forgotPasswordStep) {
      case "email":
        return "Gửi mã xác nhận";
      case "verifyCode":
        return "Xác nhận mã";
      case "newPassword":
        return "Đặt lại mật khẩu";
      default:
        return "Tiếp tục";
    }
  };

  return (
    <>
      {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} />}
      
      <Steps
        size="small"
        current={stepIndex}
        items={[
          { title: "Nhập email" },
          { title: "Xác nhận mã" },
          { title: "Mật khẩu mới" }
        ]}
        style={{ marginBottom: 16 }}
      />
      
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input 
            placeholder="you@example.com" 
            disabled={forgotPasswordStep !== "email"} 
          />
        </Form.Item>

        {forgotPasswordStep !== "email" && (
          <Form.Item
            name="resetCode"
            label="Mã xác nhận"
            rules={[
              { required: true, message: "Vui lòng nhập mã xác nhận" },
              { len: 6, message: "Mã gồm 6 chữ số" },
            ]}
          >
            <Input placeholder="123456" maxLength={6} />
          </Form.Item>
        )}

        {forgotPasswordStep === "newPassword" && (
          <>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
              hasFeedback
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>
            
            <Form.Item
              name="confirmNewPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              hasFeedback
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="••••••••" />
            </Form.Item>
          </>
        )}
      </Form>

      <Space style={{ width: "100%", marginTop: 8 }}>
        {forgotPasswordStep !== "email" && (
          <Button onClick={handleBackStep}>
            Quay lại
          </Button>
        )}
        <Button type="primary" loading={loading} onClick={handleForgotPassword}>
          {getButtonText()}
        </Button>
      </Space>

      <Divider />
      
      <Button type="link" block onClick={() => onTabChange("login")}>
        Quay về đăng nhập
      </Button>
    </>
  );
}

export default ForgotPasswordFormPage;
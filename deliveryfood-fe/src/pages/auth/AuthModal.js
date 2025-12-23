"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthMode, setError, setShowAuthModal } from "../../redux/store/slices/userSlice";

/* Ant Design */
import {
  ConfigProvider,
  Modal,
  Tabs,
  Form,
  Space,
  Typography,
} from "antd";
import ForgotPasswordFormPage from "./ForgotPasswordFormPage";
import LoginFormPage from "./LoginFormPage";
import RegisterFormPage from "./RegisterFormPage";

/* Components */


const { Text, Title } = Typography;

function AuthModal() {
  const dispatch = useDispatch();
  const { showAuthModal, authMode, error } = useSelector((s) => s.user);

  const [form] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");

  if (!showAuthModal) return null;

  const handleClose = () => {
    dispatch(setShowAuthModal(false));
    dispatch(setError(null));
    setForgotPasswordStep("email");
    form.resetFields();
    forgotForm.resetFields();
  };

  const handleTabChange = (key) => {
    dispatch(setAuthMode(key));
    dispatch(setError(null));
    setForgotPasswordStep("email");
    form.resetFields();
    forgotForm.resetFields();
  };

  const getModalTitle = () => {
    switch (authMode) {
      case "login":
        return "Đăng nhập";
      case "register":
        return "Đăng ký";
      case "forgot":
        return "Quên mật khẩu";
      default:
        return "Đăng nhập";
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: "#16a34a", borderRadius: 12 },
        components: {
          Button: { borderRadius: 10 },
          Input: { borderRadius: 10 },
          Modal: { borderRadiusLG: 16 },
        },
      }}
    >
      <Modal
        title={
          <Space direction="vertical" size={0}>
            <Title level={4} style={{ margin: 0 }}>
              {getModalTitle()}
            </Title>
            <Text type="secondary">
              {/* Có thể thêm subtitle tại đây */}
            </Text>
          </Space>
        }
        open={showAuthModal}
        onCancel={handleClose}
        footer={null}
        destroyOnClose
        centered
      >
        {authMode === "forgot" ? (
          <ForgotPasswordFormPage
            form={forgotForm}
            forgotPasswordStep={forgotPasswordStep}
            setForgotPasswordStep={setForgotPasswordStep}
            onTabChange={handleTabChange}
            onClose={handleClose}
          />
        ) : (
          <Tabs
            activeKey={authMode}
            onChange={handleTabChange}
            items={[
              { 
                key: "login", 
                label: "Đăng nhập", 
                children: <LoginFormPage form={form} onTabChange={handleTabChange} onClose={handleClose} />
              },
              { 
                key: "register", 
                label: "Đăng ký", 
                children: <RegisterFormPage form={form} onTabChange={handleTabChange} onClose={handleClose} />
              },
            ]}
          />
        )}
      </Modal>
    </ConfigProvider>
  );
}

export default AuthModal;
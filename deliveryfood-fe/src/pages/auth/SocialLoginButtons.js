import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setError, setLoading } from "../../redux/store/slices/userSlice";
import api from "../../api/api";
import { saveAuthData, formatErrorMessage } from "../utils/authHelpers";

/* Ant Design */
import { Button, Space, message } from "antd";

/* Icons */
import { FacebookFilled, GoogleOutlined } from "@ant-design/icons";

function SocialLoginButtons({ onSuccess, layout = "horizontal" }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.user);

  const handleSocialLogin = async (provider) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      const res = await api.post(`${process.env.REACT_APP_API_BASE}/auth/social`, { 
        provider: provider.toLowerCase() 
      });
      
      if (![200, 201].includes(res?.data?.statusCode)) {
        throw new Error(res?.data?.message || `Đăng nhập ${provider} thất bại`);
      }
      
      const { data } = res.data;
      const { user, access_token, refresh_token } = data || {};
      
      if (access_token && user) {
        saveAuthData(access_token, user, refresh_token);
        dispatch(login(user));
        message.success(`Đăng nhập ${provider} thành công!`);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(`Đăng nhập ${provider} thất bại`);
      }
    } catch (err) {
      const msg = formatErrorMessage(err);
      dispatch(setError(msg));
      message.error(msg);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const ButtonComponent = layout === "horizontal" ? Space.Compact : Space;
  const buttonProps = layout === "horizontal" ? { block: true } : {};

  return (
    <ButtonComponent 
      block={layout === "horizontal"} 
      direction={layout === "vertical" ? "vertical" : "horizontal"}
      style={{ width: "100%" }}
    >
      <Button 
        {...buttonProps}
        loading={loading} 
        icon={<FacebookFilled style={{ color: "#1877f2" }} />}
        onClick={() => handleSocialLogin("Facebook")}
        style={{ 
          ...(layout === "vertical" && { width: "100%", marginBottom: 8 })
        }}
      >
        Facebook
      </Button>
      
      <Button 
        {...buttonProps}
        loading={loading} 
        danger 
        icon={<GoogleOutlined />}
        onClick={() => handleSocialLogin("Google")}
        style={{ 
          ...(layout === "vertical" && { width: "100%" })
        }}
      >
        Google
      </Button>
    </ButtonComponent>
  );
}

export default SocialLoginButtons;
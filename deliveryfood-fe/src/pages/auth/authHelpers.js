import axios from "axios";

/**
 * Save authentication data to localStorage and set axios default headers
 * @param {string} token - Access token
 * @param {object} user - User data
 * @param {string|null} refreshToken - Refresh token (optional)
 */
export const saveAuthData = (token, user, refreshToken = null) => {
  try {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    
    // Set default authorization header for all axios requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Set token expiration time (default 24 hours if not provided)
    const expirationTime = user.tokenExpiration ?? Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("tokenExpiration", String(expirationTime));
    
    return true;
  } catch (err) {
    console.error("Save auth error:", err);
    return false;
  }
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiration");
    
    // Remove authorization header
    delete axios.defaults.headers.common["Authorization"];
    
    return true;
  } catch (err) {
    console.error("Clear auth error:", err);
    return false;
  }
};

/**
 * Get stored authentication data
 * @returns {object|null} Auth data or null if not found
 */
export const getStoredAuthData = () => {
  try {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");
    const refreshToken = localStorage.getItem("refresh_token");
    const tokenExpiration = localStorage.getItem("tokenExpiration");

    if (!token || !user) {
      return null;
    }

    return {
      token,
      user: JSON.parse(user),
      refreshToken,
      tokenExpiration: tokenExpiration ? parseInt(tokenExpiration) : null,
    };
  } catch (err) {
    console.error("Get stored auth error:", err);
    return null;
  }
};

/**
 * Check if token is expired
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = () => {
  try {
    const tokenExpiration = localStorage.getItem("tokenExpiration");
    if (!tokenExpiration) {
      return true;
    }
    
    return Date.now() > parseInt(tokenExpiration);
  } catch (err) {
    console.error("Check token expiration error:", err);
    return true;
  }
};

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password 
 * @returns {object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: "Mật khẩu phải có ít nhất 6 ký tự"
    };
  }
  
  // You can add more password rules here
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: true,
    message: "Mật khẩu hợp lệ"
  };
};

/**
 * Format error message from API response
 * @param {Error} error 
 * @returns {string}
 */
export const formatErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
};

/**
 * Social login providers configuration
 */
export const SOCIAL_PROVIDERS = {
  FACEBOOK: {
    name: 'Facebook',
    color: '#1877f2',
    icon: 'FacebookFilled'
  },
  GOOGLE: {
    name: 'Google',
    color: '#db4437',
    icon: 'GoogleOutlined'
  }
};
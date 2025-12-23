import { useSelector } from 'react-redux';

// Type-safe useSelector hook
export const useAppSelector = (selector) => {
  return useSelector(selector);
};

// Specific selectors for common use cases
export const useAuthUser = () => {
  return useAppSelector((state) => ({
    isAuthenticated: state.user.isLoggedIn, // ✅ Map isLoggedIn to isAuthenticated
    isLoggedIn: state.user.isLoggedIn,
    user: state.user.user,
    loading: state.user.loading,
    error: state.user.error,
  }));
};

export const useUserState = () => {
  return useAppSelector((state) => state.user);
};
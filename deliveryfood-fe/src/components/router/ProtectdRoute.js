import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Spin } from "antd";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, roles }) {
  // ✅ Fix: sử dụng isLoggedIn thay vì isAuthenticated
  const { isLoggedIn, user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debug logs
    console.log("🛡️ ProtectedRoute check:", {
      isLoggedIn,
      user,
      userRole: user?.role,
      requiredRoles: roles,
    });

    // Kiểm tra localStorage backup
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (token && userData && !isLoggedIn) {
      console.log("⚠️ Found auth data in localStorage but Redux state not updated");
      try {
        const parsedUser = JSON.parse(userData);
        console.log("📦 Stored user data:", parsedUser);
      } catch (err) {
        console.error("❌ Error parsing stored user:", err);
      }
    }

    // Delay nhỏ để đảm bảo Redux state được cập nhật
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user, roles]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}>
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  // Check authentication
  if (!isLoggedIn) {
    console.log("❌ User not authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // Check user object
  if (!user) {
    console.log("❌ No user object found, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // Check roles if required
  if (roles && roles.length > 0) {
    if (!user.role) {
      console.log("❌ User has no role, redirecting to /unauthorized");
      return <Navigate to="/" replace />;
    }

    if (!roles.includes(user.role)) {
      console.log(
        `❌ User role '${user.role}' not in allowed roles [${roles.join(", ")}], redirecting to /unauthorized`
      );
      return <Navigate to="/" replace />;
    }
  }

  console.log("✅ Access granted to protected route");
  return children;
}
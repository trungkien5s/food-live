import { Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { store } from "./redux/store/store";
import SocketTester from "./pages/SocketTester";


import { restoreUser } from "./redux/store/slices/userSlice";
import { useEffect } from "react";
import axios from "axios";
import ActivatePage from "./pages/auth/ActivatePage";
import { ConfigProvider } from "antd";
import HomePage from "./pages/user/homepage/HomePage";
import MenuPage from "./pages/user/menuPage/MenuPage";
import RestaurantsPage from "./pages/user/restaurantsPage/RestaurantsPage";
import RestaurantDetailPage from "./pages/user/restaurantsPage/RestaurantDetailPage";
import CategoryPage from "./pages/user/categoriesPage/CategoryPage";
import CheckOutPage from "./pages/user/checkout/CheckOutPage";
import SearchPage from "./pages/user/searchPage/SearchPage";
import OrderPage from "./pages/user/orderPage/OrderPage";
import { IntroPage } from "./pages/user/IntroPage/IntroPage";
import ProfilePage from "./pages/user/profilePage/ProfilePage";
import ProtectedRoute from "./components/router/ProtectdRoute";
import { AdminDashboard } from "./pages/admin/dashboard/AdminDashboard";
import { ManageOrders } from "./pages/admin/manageOrders/ManageOrders";
import { ManageAccounts } from "./pages/admin/manageAccounts/ManageAccounts";


function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Khôi phục session khi app load
    dispatch(restoreUser());

    // Thiết lập axios interceptor để tự động thêm token vào headers
    const token = localStorage.getItem("access_token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("🔐 Authorization header set for axios");
    }

    // Axios interceptor để handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log("🚫 Received 401, token might be expired");
          dispatch({ type: "user/tokenExpired" });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [dispatch]);

  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#16a34a", 
          },
        }}
      >
        <Routes>
          
          {/*<Route path="/" element={<SocketTester />} />*/}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/activate" element={<ActivatePage />} />
          <Route path="/about" element={<IntroPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* <Route path="/menu" element={<MenuPage />} /> */}
          <Route path="/categories/:id" element={<CategoryPage />} />
          <Route path="/checkout" element={<CheckOutPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/orders" element={<OrderPage />} />

          {/* <Route path="/menu/:id" element={<MenuDetailPage />} /> */}
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />


          <Route
    path="/admin/dashboard"
    element={
      <ProtectedRoute roles={["ADMIN"]}>
        <AdminDashboard />
      </ProtectedRoute>
    }
      />

      <Route
    path="/admin/users"
    element={
      <ProtectedRoute roles={["ADMIN"]}>
        <ManageAccounts />
      </ProtectedRoute>
    }
      />

      <Route
    path="/admin/orders"
    element={
      <ProtectedRoute roles={["ADMIN"]}>
        <ManageOrders />
      </ProtectedRoute>
    }
      />
        </Routes>
      </ConfigProvider>
    </Provider>
  );
}

export default App;

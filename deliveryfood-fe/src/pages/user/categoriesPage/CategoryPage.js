import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../../components/layout/Layout";
import axios from "axios";
import {
  Search, Star, Tag, ChevronsLeft, ChevronsRight, ShoppingCart, ArrowLeft, Filter, MapPin, Clock
} from "lucide-react";
import { addToCartOptimistic } from "../../../redux/store/slices/cartSlice";
import { useAppDispatch } from "../../../redux/store/store";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";
import { setAuthMode, setShowAuthModal } from "../../../redux/store/slices/userSlice";

const PAGE_SIZE = 12;

// safe getter
const get = (obj, path, fallback = undefined) => {
  try {
    const val = path.split(".").reduce((a, c) => (a == null ? a : a[c]), obj);
    return val == null ? fallback : val;
  } catch {
    return fallback;
  }
};

export default function CategoryPage() {
  const { id, categoryId, categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categoryData, setCategoryData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [page, setPage] = useState(1);

  const apiURL = process.env.REACT_APP_API_BASE || "";

  // Fetch specific category data
  const key = categorySlug || id || categoryId;
  
  useEffect(() => {
    let mounted = true;
    if (!key) return;
    
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        
        console.log(`Fetching category: ${apiURL}/categories/${key}`);

        const token = localStorage.getItem("access_token");
        const res = await axios.get(`${apiURL}/categories/${key}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        console.log("Category API Response:", res.data);

        const data = res.data?.data || res.data;
        
        if (mounted && data) {
          setCategoryData(data);
          setCurrentCategory({
            _id: data._id,
            name: data.name,
            slug: data.slug,
            description: data.description,
          });
        }
      } catch (e) {
        console.error("Fetch category error:", e);
        if (mounted) {
          setErr(e?.response?.data?.message || e.message || "Không tải được danh mục");
          setCurrentCategory(null);
          setCategoryData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [key, apiURL]);

  // Extract unique restaurants from menu items
  const restaurants = useMemo(() => {
    if (!categoryData?.menuItems) return [];
    
    const restaurantMap = new Map();
    
    categoryData.menuItems.forEach(item => {
      if (item.restaurant && item.restaurant._id) {
        const restaurant = item.restaurant;
        const restaurantId = restaurant._id;
        
        if (!restaurantMap.has(restaurantId)) {
          restaurantMap.set(restaurantId, {
            _id: restaurantId,
            name: restaurant.name,
            address: restaurant.address,
            isOpen: restaurant.isOpen,
            // Count menu items for this restaurant
            menuItemsCount: 1,
            // Store sample menu items (for preview)
            sampleMenuItems: [item],
          });
        } else {
          const existing = restaurantMap.get(restaurantId);
          existing.menuItemsCount += 1;
          if (existing.sampleMenuItems.length < 3) {
            existing.sampleMenuItems.push(item);
          }
        }
      }
    });
    
    return Array.from(restaurantMap.values());
  }, [categoryData]);

  // Normalize restaurants for display
  const normalized = useMemo(() => {
    return restaurants.map((r) => {
      // Calculate average rating from menu items
      const ratings = r.sampleMenuItems.map(item => item.rating).filter(Boolean);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      return {
        id: r._id,
        name: r.name || "Nhà hàng",
        image: r.sampleMenuItems[0]?.image || null, // Use first menu item image as restaurant image
        address: r.address || "",
        phone: r.phone || "",
        rating: avgRating,
        isOpen: Boolean(r.isOpen),
        menuItemsCount: r.menuItemsCount,
        sampleMenuItems: r.sampleMenuItems,
        tags: [currentCategory?.name].filter(Boolean), // Category as tag
        raw: r,
      };
    });
  }, [restaurants, currentCategory]);

  // Filter and sort restaurants
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    let arr = normalized.filter((r) => {
      if (!term) return true;
      return (
        r.name?.toLowerCase().includes(term) ||
        r.address?.toLowerCase().includes(term) ||
        r.sampleMenuItems.some(item => 
          item.title?.toLowerCase().includes(term) ||
          item.menu?.title?.toLowerCase().includes(term)
        )
      );
    });

    arr = arr.sort((a, b) => {
      switch (sortBy) {
        case "rating_desc":
          return (b.rating || -1) - (a.rating || -1);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "open_first":
          return (b.isOpen === true) - (a.isOpen === true) || ((b.rating||0)-(a.rating||0));
        case "menu_count_desc":
          return b.menuItemsCount - a.menuItemsCount;
        case "popular":
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    return arr;
  }, [normalized, q, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [q, sortBy, key]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <SkeletonGrid />
        </div>
      </Layout>
    );
  }

  if (err || !currentCategory) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {err ? "Lỗi tải dữ liệu" : "Danh mục không tồn tại"}
            </h2>
            <p className="text-gray-600 mb-4">
              {err || "Danh mục bạn tìm kiếm không có hoặc đã bị xóa."}
            </p>
            <button
              onClick={() => navigate("/menu")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại thực đơn
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <button
                onClick={() => navigate("/menu")}
                className="hover:text-green-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Thực đơn
              </button>
              <span>/</span>
              <span className="text-gray-800 font-medium">{currentCategory.name}</span>
            </nav>

            <h1 className="text-2xl font-bold text-gray-800">{currentCategory.name}</h1>
            {currentCategory.description && (
              <p className="text-gray-600 text-sm mt-1">{currentCategory.description}</p>
            )}
            <p className="text-gray-500 text-sm">
              {loading ? "Đang tải..." : `Có ${filtered.length} nhà hàng`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Tìm kiếm nhà hàng trong ${currentCategory.name}...`}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="popular">Phổ biến</option>
              <option value="rating_desc">Điểm cao → thấp</option>
              <option value="name_asc">Tên (A→Z)</option>
              <option value="open_first">Đang mở cửa</option>
              <option value="menu_count_desc">Nhiều món nhất</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {pageItems.length === 0 ? (
          <EmptyState 
            categoryName={currentCategory.name}
            onClear={() => setQ("")} 
            hasSearchTerm={!!q}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pageItems.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  className="px-3 py-2 rounded border text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={current === 1}
                >
                  <ChevronsLeft className="w-4 h-4" /> Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang <strong>{current}</strong> / {totalPages}
                </span>
                <button
                  className="px-3 py-2 rounded border text-sm hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={current === totalPages}
                >
                  Sau <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

/* ---------- Restaurant Card Component ---------- */
function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  const openRestaurant = () => {
    navigate(`/restaurants/${restaurant.id}`);
  };

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRestaurant();
    }
  };

  return (
    <div
      onClick={openRestaurant}
      onKeyDown={onKey}
      role="button"
      tabIndex={0}
      aria-label={`Mở nhà hàng ${restaurant.name}`}
      className="rounded-2xl border border-gray-200 overflow-hidden transition-shadow bg-white hover:shadow-md cursor-pointer"
    >
      <div className="relative h-40 bg-gray-100">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Không có ảnh
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              restaurant.isOpen
                ? "bg-emerald-600 text-white"
                : "bg-gray-600 text-white"
            }`}
          >
            {restaurant.isOpen ? "Đang mở cửa" : "Đóng cửa"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Restaurant Name & Rating */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-800 line-clamp-2">{restaurant.name}</h3>
          {restaurant.rating > 0 && (
            <div className="text-amber-600 flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm">{restaurant.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Address */}
        {restaurant.address && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{restaurant.address}</span>
          </div>
        )}

        {/* Menu Items Count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Tag className="w-4 h-4" />
          <span>{restaurant.menuItemsCount} món trong danh mục này</span>
        </div>

        {/* Sample Menu Items Preview */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Món nổi bật:</p>
          <div className="flex flex-wrap gap-1">
            {restaurant.sampleMenuItems.slice(0, 3).map((item, idx) => (
              <span
                key={`${item._id}-${idx}`}
                className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs"
              >
                {item.title}
              </span>
            ))}
          </div>
        </div>

        {/* View Restaurant Button */}
        {/* <button
          type="button"
          className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          onClick={openRestaurant}
        >
          Xem thực đơn
        </button> */}
      </div>
    </div>
  );
}

/* ---------- Other Components ---------- */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden bg-white animate-pulse">
          <div className="h-40 bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-5 bg-gray-100 rounded w-16" />
              <div className="h-5 bg-gray-100 rounded w-14" />
            </div>
            <div className="h-8 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ categoryName, onClear, hasSearchTerm }) {
  return (
    <div className="border border-dashed border-gray-300 rounded-2xl p-10 text-center bg-white">
      <p className="text-gray-700 font-medium">
        {hasSearchTerm ? "Không tìm thấy nhà hàng nào" : `Chưa có nhà hàng trong ${categoryName}`}
      </p>
      <p className="text-gray-500 text-sm mt-1">
        {hasSearchTerm 
          ? "Thử thay đổi từ khóa tìm kiếm." 
          : "Danh mục này chưa có nhà hàng nào. Hãy quay lại sau nhé!"
        }
      </p>
      {hasSearchTerm && (
        <button
          onClick={onClear}
          className="mt-4 px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-black"
        >
          Xoá từ khóa tìm kiếm
        </button>
      )}
    </div>
  );
}
// src/pages/SearchPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Tag, Pagination, Empty, Spin, Space, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Layout from "../../../components/layout/Layout";
import RestaurantCard from "../restaurantsPage/RestaurantCard";
import { searchRestaurants } from "../../../api/seacrhApi";
import SearchBar from "../../../components/common/SearchBar";



const DEFAULT_LIMIT = 24;
const sortOptions = [
  { value: "relevance", label: "Đúng nhất" },
  { value: "rating", label: "Đánh giá cao" },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const limit = Number(params.get("limit") || DEFAULT_LIMIT);
  const sort = params.get("sort") || "relevance";

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [suggests, setSuggests] = useState([]);
  const controllerRef = useRef(null);

  const requestParams = useMemo(() => ({ q, page, limit, sort }), [q, page, limit, sort]);

  const setMany = (obj) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(obj).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    if ("q" in obj || "sort" in obj) next.set("page", "1");
    navigate({ pathname: "/search", search: next.toString() }, { replace: false });
  };

  useEffect(() => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    setLoading(true);

    searchRestaurants(requestParams, controllerRef.current.signal)
      .then((res) => {
        setItems(res?.results?.restaurants || []);
        setTotal(res?.totals?.restaurants || 0);
        setSuggests(res?.suggestions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controllerRef.current?.abort?.();
  }, [requestParams]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4">
        {/* Thanh trên: tổng + sort (đơn giản như yêu cầu) */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="text-sm text-gray-600">{total} Kết quả</div>
          <Select
            value={sort}
            style={{ width: 140 }}
            options={sortOptions}
            onChange={(v) => setMany({ sort: v })}
          />
          {/* <Button icon={<SearchOutlined />} onClick={() => setMany({ q })}>
            Tìm
          </Button> */}
        </div>

        {/* Chip “Từ khóa: q” */}
        {q && (
          <div className="mb-3 text-sm">
            <Space>
              <span className="text-gray-500">Từ khóa:</span>
              <Tag color="default">{q}</Tag>
              {suggests.slice(0,6).map((s, i) => (
             <Tag key={i} onClick={() => setMany({ q: s.text })} className="cursor-pointer">
                {s.text}
              </Tag>
            ))}
            </Space>
          </div>
        )}

        {/* Lưới kết quả (chỉ nhà hàng) */}
        <Spin spinning={loading}>
          {items.length === 0 ? (
            <Empty description="Không tìm thấy nhà hàng" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.filter(Boolean).map((r) => (
   <RestaurantCard key={r._id || r.id} r={r} />
     ))}
              </div>

              {/* Phân trang */}
              <div className="mt-4 flex justify-end">
                <Pagination
                  current={page}
                  pageSize={limit}
                  total={total}
                  onChange={(p) => setMany({ page: p })}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </Spin>
      </div>
    </Layout>
  );
}

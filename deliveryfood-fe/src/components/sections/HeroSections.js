import { useRef, useState, useEffect, useMemo } from "react";
import { Carousel, Button, Tag, Typography, Image, Skeleton, Empty, message } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function HeroSection() {
  const carouselRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const API = process.env.REACT_APP_API_BASE; // vd: http://localhost:8000/api/v1
    (async () => {
      try {
        const { data } = await axios.get(`${API}/restaurants`);
        const list = data?.data ?? [];
        if (mounted) setRestaurants(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        message.error("Không tải được danh sách nhà hàng");
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  // Top 5 rating, ưu tiên có ảnh
  const bannerItems = useMemo(() => {
    return [...restaurants]
      .filter(r => r?.image)
      .sort((a, b) => (b?.rating ?? 0) - (a?.rating ?? 0))
      .slice(0, 5);
  }, [restaurants]);

  const next = () => carouselRef.current?.next();
  const prev = () => carouselRef.current?.prev();
  const goTo = (i) => carouselRef.current?.goTo?.(i, true);

  return (
    <section className="w-full">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-green-50 via-green-100 to-emerald-200">
          {/* blobs trang trí */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-green-300 rounded-full blur-xl" />
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-emerald-300 rounded-full blur-xl" />
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-lime-300 rounded-full blur-lg" />
          </div>

          <div className="relative w-full h-[500px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton.Image style={{ width: "100%", height: 500 }} active />
              </div>
            ) : bannerItems.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-white/50">
                <Empty description="Chưa có banner phù hợp" />
              </div>
            ) : (
              <>
                <Carousel
                  ref={carouselRef}
                  autoplay
                  autoplaySpeed={4500}
                  dots={false} /* ẩn dots mặc định, dùng thumbnails */
                  afterChange={setCurrent}
                  effect="scrollx"
                  className="w-full h-full"
                >
                  {bannerItems.map((r) => (
                    <div key={r._id} className="w-full h-[500px]">
                      <div
                        className="relative w-full h-full group cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/restaurants/${r._id}`)}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/restaurants/${r._id}`)}
                      >
                        {/* Ảnh nền + hiệu ứng kenburns */}
                        <div className="absolute inset-0 overflow-hidden">
                          <Image
                            src={r.image}
                            alt={r.name}
                            preview={false}
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            style={{
                              width: "100%", height: "100%", objectFit: "cover", display: "block",
                              transformOrigin: "center",
                            }}
                            className="kenburns will-change-transform"
                            fallback="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&h=500&fit=crop&crop=center"
                          />
                        </div>

                        {/* Vignette + gradient che mép để chữ nổi bật */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-120px_160px_-60px_rgba(0,0,0,0.6)]" />

                        {/* Badge góc trên */}
                        <div className="absolute top-5 left-6 z-10">
                          <Tag color="gold" className="px-3 py-1 rounded-full font-semibold shadow">
                            Top rating
                          </Tag>
                        </div>

                        {/* Thẻ thông tin kiểu “glass” */}
                        <div className="absolute bottom-8 left-6 z-10">
                          <div className="backdrop-blur-md bg-white/15 border border-white/20 rounded-2xl p-4 pr-5 shadow-lg max-w-[70%] transition-all duration-300 group-hover:shadow-2xl">
                            <Title level={3} style={{ color: "#fff", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,.35)" }}>
                              {r.name}
                            </Title>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Tag color="green" className="m-0">⭐ {Number(r.rating ?? 0).toFixed(1)}</Tag>
                              {r.isOpen !== undefined && (
                                <Tag color={r.isOpen ? "blue" : "red"} className="m-0">
                                  {r.isOpen ? "Đang mở cửa" : "Đóng cửa"}
                                </Tag>
                              )}
                              {r.address && (
                                <Text style={{ color: "#fff" }} className="opacity-90 truncate">
                                  {r.address}
                                </Text>
                              )}
                            </div>
                            <Button
                              type="primary"
                              size="large"
                              className="mt-3"
                              onClick={(e) => { e.stopPropagation(); navigate(`/restaurants/${r._id}`); }}
                            >
                              Xem quán
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Carousel>

                {/* Nút chuyển trái/phải */}
                <Button
                  shape="circle" size="large" icon={<LeftOutlined />} onClick={prev}
                  className="!absolute left-4 top-1/2 -translate-y-1/2 bg-white/85 hover:!bg-white shadow-lg"
                  aria-label="Slide trước"
                />
                <Button
                  shape="circle" size="large" icon={<RightOutlined />} onClick={next}
                  className="!absolute right-4 top-1/2 -translate-y-1/2 bg-white/85 hover:!bg-white shadow-lg"
                  aria-label="Slide sau"
                />

                {/* Thumbnails điều hướng */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {bannerItems.map((r, i) => (
                    <button
                      key={r._id}
                      onClick={(e) => { e.stopPropagation(); goTo(i); }}
                      className={`w-16 h-11 rounded-xl overflow-hidden ring-2 transition 
                                  ${current === i ? "ring-white shadow-lg scale-105" : "ring-white/40 hover:ring-white/70"}`}
                      aria-label={`Tới banner ${i + 1}`}
                    >
                      <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS cho ken-burns & tuỳ biến */}
      <style jsx>{`
        @keyframes kenburnsZoom {
          0%   { transform: scale(1.05); }
          100% { transform: scale(1.15); }
        }
        .kenburns { animation: kenburnsZoom 14s ease-in-out infinite alternate; }
      `}</style>
    </section>
  );
}

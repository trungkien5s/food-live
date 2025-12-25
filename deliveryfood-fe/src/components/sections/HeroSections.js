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
    const API = process.env.REACT_APP_API_BASE;
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg sm:shadow-xl lg:shadow-2xl bg-gradient-to-br from-green-50 via-green-100 to-emerald-200">
          {/* blobs trang trí - hidden on mobile */}
          <div className="absolute inset-0 opacity-5 pointer-events-none hidden sm:block">
            <div className="absolute top-10 left-10 w-24 h-24 bg-green-300 rounded-full blur-2xl" />
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-emerald-300 rounded-full blur-2xl" />
          </div>

          {/* Responsive height: mobile 200px -> tablet 320px -> desktop 420px -> large 480px */}
          <div className="relative w-full h-[200px] sm:h-[320px] md:h-[420px] lg:h-[480px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton.Image style={{ width: "100%", height: "100%" }} active />
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
                  dots={false}
                  afterChange={setCurrent}
                  effect="scrollx"
                  className="w-full h-full"
                >
                  {bannerItems.map((restaurant) => (
                    <div key={restaurant._id} className="w-full h-[200px] sm:h-[320px] md:h-[420px] lg:h-[480px]">
                      <div
                        className="relative w-full h-full group cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/restaurants/${restaurant._id}`)}
                        onKeyDown={(e) => e.key === "Enter" && navigate(`/restaurants/${restaurant._id}`)}
                      >
                        {/* Ảnh nền + hiệu ứng kenburns */}
                        <div className="absolute inset-0 overflow-hidden">
                          <Image
                            src={restaurant.image}
                            alt={restaurant.name}
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

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-80px_100px_-40px_rgba(0,0,0,0.3)]" />

                        {/* Badge góc trên - smaller on mobile */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-4 lg:top-5 lg:left-6 z-10">
                          <Tag color="gold" className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-semibold shadow text-[10px] sm:text-xs lg:text-sm">
                            Top rating
                          </Tag>
                        </div>

                        {/* Thẻ thông tin kiểu "glass" - compact on mobile */}
                        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto md:bottom-6 lg:bottom-8 lg:left-6 z-10">
                          <div className="backdrop-blur-md bg-white/15 border border-white/20 rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 lg:pr-5 shadow-lg max-w-full sm:max-w-[70%] transition-all duration-300 group-hover:shadow-2xl">
                            <Title 
                              level={3} 
                              className="text-sm sm:text-base md:text-xl lg:text-2xl line-clamp-1" 
                              style={{ color: "#fff", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,.35)" }}
                            >
                              {restaurant.name}
                            </Title>
                            <div className="mt-1 sm:mt-1.5 lg:mt-2 flex flex-wrap items-center gap-1 sm:gap-1.5 lg:gap-2">
                              <Tag color="green" className="m-0 text-[10px] sm:text-xs">
                                ⭐ {Number(restaurant.rating ?? 0).toFixed(1)}
                              </Tag>
                              {restaurant.isOpen !== undefined && (
                                <Tag color={restaurant.isOpen ? "blue" : "red"} className="m-0 text-[10px] sm:text-xs">
                                  {restaurant.isOpen ? "Đang mở" : "Đóng"}
                                </Tag>
                              )}
                              {restaurant.address && (
                                <Text 
                                  style={{ color: "#fff", fontSize: 11 }} 
                                  className="opacity-90 truncate hidden sm:inline sm:text-xs"
                                >
                                  {restaurant.address}
                                </Text>
                              )}
                            </div>
                            <Button
                              type="primary"
                              size="small"
                              className="mt-1.5 sm:mt-2 lg:mt-3 text-[11px] sm:text-xs lg:text-sm sm:size-middle"
                              onClick={(e) => { e.stopPropagation(); navigate(`/restaurants/${restaurant._id}`); }}
                            >
                              Xem quán
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Carousel>

                {/* Nút chuyển trái/phải - hidden on mobile, show from sm */}
                <Button
                  shape="circle" 
                  size="middle"
                  icon={<LeftOutlined />} 
                  onClick={prev}
                  className="!absolute left-2 sm:left-3 lg:left-4 top-1/2 -translate-y-1/2 bg-white/85 hover:!bg-white shadow-lg hidden sm:flex"
                  aria-label="Slide trước"
                />
                <Button
                  shape="circle" 
                  size="middle"
                  icon={<RightOutlined />} 
                  onClick={next}
                  className="!absolute right-2 sm:right-3 lg:right-4 top-1/2 -translate-y-1/2 bg-white/85 hover:!bg-white shadow-lg hidden sm:flex"
                  aria-label="Slide sau"
                />

                {/* Thumbnails điều hướng - smaller on mobile */}
                {/* Thumbnails điều hướng */}
<div className="absolute bottom-1 sm:bottom-2 lg:bottom-3 left-1/2 -translate-x-1/2 z-20
                hidden sm:flex gap-1 sm:gap-1.5 lg:gap-2 max-w-[95%]">
  {bannerItems.map((r, i) => (
    <button
      key={r._id}
      onClick={(e) => { e.stopPropagation(); goTo(i); }}
      className={`w-12 h-8 lg:w-16 lg:h-11 rounded-lg lg:rounded-xl overflow-hidden ring-2 transition 
                  ${current === i ? "ring-white shadow-lg scale-105" : "ring-white/40 hover:ring-white/70"}`}
      aria-label={`Tới banner ${i + 1}`}
    >
      <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
    </button>
  ))}
</div>

{/* CSS kenburns (CRA) */}
<style>{`
  @keyframes kenburnsZoom {
    0%   { transform: scale(1.05); }
    100% { transform: scale(1.15); }
  }
  .kenburns { animation: kenburnsZoom 14s ease-in-out infinite alternate; }
`}</style>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS cho ken-burns */}
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
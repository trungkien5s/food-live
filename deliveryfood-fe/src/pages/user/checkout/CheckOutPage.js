"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks/useAppSelector";
import { useAppDispatch } from "../../../redux/store/store";
import { fetchCartItems } from "../../../redux/store/slices/cartSlice";
import { createOrderFromRestaurant, fetchMyOrders } from "../../../redux/store/slices/ordersSlice";
import Layout from "../../../components/layout/Layout";

import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Divider,
  Avatar,
  Space,
  Dropdown,
  Tag,
  message,
  Spin,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  ShopOutlined,
  FileTextOutlined,
  DownOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

/* ---------- helpers (giữ nguyên) ---------- */
const fmt = (v) =>
  Number(v || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const getId = (it) => it?.id || it?._id;
const unitPrice = (it) => {
  const base = it?.basePrice ?? it?.menuItem?.basePrice ?? it?.menuItem?.price ?? it?.price;
  if (base != null && !Number.isNaN(Number(base))) return Number(base);
  const cents = it?.menuItem?.price_cents ?? it?.price_cents;
  return cents != null && !Number.isNaN(Number(cents)) ? Number(cents) / 100 : 0;
};
const nameOf = (it, i) => it?.menuItem?.title || it?.menuItem?.name || it?.name || `Món #${i + 1}`;
const imgOf = (it) => it?.menuItem?.image || it?.image || "https://placehold.co/80x80?text=🍽️";
const imgSrc = (img) => (typeof img === "string" ? img : img?.url || img?.secure_url || null);
const restaurantIdOf = (it) => {
  const r =
    (it?.menuItem?.menu?.restaurant &&
      typeof it.menuItem.menu.restaurant === "object" &&
      it.menuItem.menu.restaurant) ||
    (it?.menuItem?.restaurant &&
      typeof it.menuItem.restaurant === "object" &&
      it.menuItem.restaurant) ||
    (it?.menu?.restaurant && typeof it.menu.restaurant === "object" && it.menu.restaurant) ||
    null;

  return (
    (r?._id || r?.id) ||
    it?.menuItem?.restaurant ||
    it?.menu?.restaurant ||
    it?.restaurantId ||
    "unknown"
  )?.toString?.() || "unknown";
};
const restaurantNameOf = (it) => {
  const r =
    (it?.menuItem?.menu?.restaurant &&
      typeof it.menuItem.menu.restaurant === "object" &&
      it.menuItem.menu.restaurant) ||
    (it?.menuItem?.restaurant &&
      typeof it.menuItem.restaurant === "object" &&
      it.menuItem.restaurant) ||
    (it?.menu?.restaurant && typeof it.menu.restaurant === "object" && it.menu.restaurant) ||
    null;

  return (
    r?.name ||
    r?.title ||
    it?.restaurantName ||
    it?.menuItem?.restaurantName ||
    it?.menu?.restaurantName ||
    "Nhà hàng"
  );
};
const restaurantInfoOf = (it) => {
  const r =
    (it?.menuItem?.menu?.restaurant &&
      typeof it.menuItem.menu.restaurant === "object" &&
      it.menuItem.menu.restaurant) ||
    (it?.menuItem?.restaurant &&
      typeof it.menuItem.restaurant === "object" &&
      it.menuItem.restaurant) ||
    (it?.menu?.restaurant && typeof it.menu.restaurant === "object" && it.menu.restaurant) ||
    null;

  const id = restaurantIdOf(it);
  const name = restaurantNameOf(it);
  const image = (r && (r.image || r.logo || r.photos?.[0])) || it?.restaurantImage || null;
  const address = (r && r.address) || it?.restaurantAddress || "";
  const isOpen = !!(r && r.isOpen);

  return { id, name, image, address, isOpen, rawRestaurant: r };
};

/* ---------- reverse geocode (Nominatim) - now returns components ---------- */
const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=vi`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();
    const address = data.address || {};
    const displayName = data.display_name || "";

    // build human-friendly parts
    const parts = [];
    if (address.house_number && address.road) parts.push(`${address.house_number} ${address.road}`);
    else if (address.road) parts.push(address.road);

    if (address.suburb) parts.push(address.suburb);
    // use common Vietnamese keys if present
    if (address.ward) parts.push(`Phường ${address.ward}`);
    if (address.city_district) parts.push(`Quận ${address.city_district}`);
    if (address.city) parts.push(address.city);
    if (address.county) parts.push(address.county);

    const detailed = parts.join(", ").trim();
    const finalDetailed = detailed?.length > 4 ? detailed : displayName || "Không xác định";
    const short = parts[0] || displayName;

    // normalized components we care about (try multiple keys)
    const components = {
      house_number: address.house_number || null,
      road: address.road || address.road || null,
      suburb: address.suburb || null,
      ward: address.ward || address.suburb || null, // sometimes ward in different key
      district: address.city_district || address.county || null,
      city: address.city || address.town || address.village || null,
      postcode: address.postcode || null,
      county: address.county || null,
      state: address.state || null,
      country: address.country || null,
    };

    return { detailed: finalDetailed, short, full: displayName, components };
  } catch (err) {
    console.error(err);
    return { detailed: "Không xác định", short: "Không xác định", full: "", components: {} };
  }
};

/* ---------- geolocation hook (giữ nhưng nhẹ) ---------- */
const useGeolocationWithLeaflet = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
    address: { detailed: "", short: "", full: "", components: {} },
  });

  const getCurrentLocation = useCallback(() => {
    setLocation((s) => ({ ...s, loading: true, error: null }));
    if (!navigator.geolocation) {
      setLocation((s) => ({ ...s, loading: false, error: "Trình duyệt không hỗ trợ định vị" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const addr = await reverseGeocode(latitude, longitude);
        setLocation({ latitude, longitude, loading: false, error: null, address: addr });
      },
      (err) => {
        setLocation((s) => ({ ...s, loading: false, error: "Không thể lấy vị trí", address: s.address }));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return { ...location, refetch: getCurrentLocation };
};

/* ---------- LocationPicker with map picker & "Thêm địa điểm" (fixed) ---------- */
function LocationPicker({ value, note: initialNote, onChange }) {
  const { latitude, longitude, address: detectedAddr, loading: detecting, error: detectError, refetch } =
    useGeolocationWithLeaflet();

  const [open, setOpen] = useState(false);
  const [draftAddress, setDraftAddress] = useState(value || "");
  const [draftNote, setDraftNote] = useState(initialNote || "");
  const [coords, setCoords] = useState({ lat: latitude, lng: longitude });
  const [leafletReady, setLeafletReady] = useState(false);
  const [addressComponents, setAddressComponents] = useState(detectedAddr?.components || {});

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const Lref = useRef(null);

  // sync detected coords -> local coords + components
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ lat: latitude, lng: longitude });
      if (!draftAddress) setDraftAddress(detectedAddr?.detailed || "");
      if (detectedAddr?.components) setAddressComponents(detectedAddr.components || {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, detectedAddr]);

  // initialize leaflet map when modal opens (safe init + cleanup)
  useEffect(() => {
    let mounted = true;

    async function initMapOnce() {
      // if already created, do nothing
      if (mapInstanceRef.current) {
        // if map exists but coords updated before modal opened, update marker/pan
        try {
          const map = mapInstanceRef.current;
          if (map && coords?.lat && coords?.lng) {
            map.setView([coords.lat, coords.lng], map.getZoom());
            if (markerRef.current) markerRef.current.setLatLng([coords.lat, coords.lng]);
          }
        } catch (e) {}
        return;
      }

      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        Lref.current = L;

        // Try to set default icon paths (bundlers sometimes need this)
        try {
          // require may work in CRA; wrap in try/catch
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const iconRetinaUrl = require("leaflet/dist/images/marker-icon-2x.png");
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const iconUrl = require("leaflet/dist/images/marker-icon.png");
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const shadowUrl = require("leaflet/dist/images/marker-shadow.png");
          L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
        } catch (err) {
          // ignore if bundler can't resolve - not critical
        }

        const container = mapRef.current;
        if (!container) return;

        const startLat = coords?.lat ?? 21.0285;
        const startLng = coords?.lng ?? 105.8542;

        // create map
        const map = L.map(container, { center: [startLat, startLng], zoom: 16, preferCanvas: true });
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
        markerRef.current = marker;

        marker.on("dragend", async (ev) => {
          try {
            const pos = ev.target.getLatLng();
            setCoords({ lat: pos.lat, lng: pos.lng });
            const a = await reverseGeocode(pos.lat, pos.lng);
            setDraftAddress(a.detailed || a.full || "");
            setAddressComponents(a.components || {});
          } catch (err) {
            console.error("dragend reverse geocode err", err);
          }
        });

        map.on("click", async (ev) => {
          try {
            const { lat, lng } = ev.latlng;
            if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
            setCoords({ lat, lng });
            const a = await reverseGeocode(lat, lng);
            setDraftAddress(a.detailed || a.full || "");
            setAddressComponents(a.components || {});
          } catch (err) {
            console.error("map click reverse geocode err", err);
          }
        });

        // Resize fix after render
        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch (e) {}
        }, 200);

        if (mounted) setLeafletReady(true);
      } catch (err) {
        console.warn("Leaflet init failed:", err);
        if (mounted) setLeafletReady(false);
      }
    }

    if (open) initMapOnce();

    return () => {
      mounted = false;
      // safe cleanup: remove map only if exists
      try {
        const map = mapInstanceRef.current;
        if (map) {
          try { map.off(); } catch (e) {}
          try { map.remove(); } catch (e) {}
          mapInstanceRef.current = null;
          markerRef.current = null;
        }
      } catch (e) {
        // swallow
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // If coords change while map exists, update marker & view
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && coords?.lat && coords?.lng) {
      try {
        map.setView([coords.lat, coords.lng], map.getZoom());
        if (markerRef.current) markerRef.current.setLatLng([coords.lat, coords.lng]);
      } catch (e) {}
    }
  }, [coords]);

  const openModal = () => {
    setOpen(true);
  };

  const onUseDetected = async () => {
    if (detectedAddr?.detailed) {
      setDraftAddress(detectedAddr.detailed);
      setCoords({ lat: latitude, lng: longitude });
      setAddressComponents(detectedAddr.components || {});
    } else {
      message.warning("Không có địa chỉ phát hiện sẵn. Hãy cập nhật vị trí hoặc chọn trên bản đồ.");
    }
  };

  const onConfirm = () => {
    onChange?.({
      address: draftAddress || detectedAddr?.detailed || "",
      location: { lat: coords.lat, lng: coords.lng },
      note: draftNote || "",
      components: addressComponents || {},
    });
    setOpen(false);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          value={draftAddress || value || ""}
          placeholder="Chọn địa chỉ hoặc nhấp Thêm địa điểm"
          prefix={<EnvironmentOutlined />}
          readOnly
          onClick={openModal}
        />
        <Button onClick={openModal}>Thêm địa điểm</Button>
      </div>

      <Modal
        title="Chọn / Thêm địa chỉ giao hàng"
        open={open}
        onCancel={() => setOpen(false)}
        width={860}
        okText="Dùng địa chỉ này"
        onOk={onConfirm}
      >
        <Row gutter={12}>
          <Col span={14}>
            <div
              ref={mapRef}
              style={{ width: "100%", height: 400, borderRadius: 8, border: "1px solid #eee", overflow: "hidden" }}
            >
              {!leafletReady && (
                <div style={{ padding: 20 }}>
                  <Text type="secondary">
                    Bản đồ chưa sẵn sàng. Nếu bạn chưa cài <code>leaflet</code>, chạy:
                  </Text>
                  <pre style={{ background: "#fafafa", padding: 8, marginTop: 8 }}>npm install leaflet</pre>
                  <Text type="secondary">và import CSS: <code>import 'leaflet/dist/leaflet.css'</code> trong index.css</Text>
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <Button onClick={onUseDetected} disabled={detecting}>
                {detecting ? <><LoadingOutlined /> Đang lấy vị trí</> : "Dùng vị trí hiện tại"}
              </Button>
              <Button onClick={() => refetch()}>Cập nhật vị trí</Button>
            </div>
          </Col>

          <Col span={10}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Địa chỉ (xem trước)</Text>
              <Input.TextArea
                rows={3}
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                placeholder="Sửa địa chỉ nếu cần (số nhà, đường, ...)"
              />

              <Text strong>Ghi chú địa chỉ cụ thể</Text>
              <Input
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Tầng 3, căn hộ 301 / Cửa sau..."
              />
              <div style={{ fontSize: 12, color: "#888" }}>
                Nhập ghi chú để shipper tìm nhanh hơn.
              </div>

              <Divider />

              <div>
                <Text type="secondary">Tọa độ hiện tại</Text>
                <div>{coords?.lat ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Chưa có"}</div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="secondary">Chi tiết địa chỉ (nếu có):</Text>
                  <div style={{ marginTop: 4 }}>
                    <div>Phường: {addressComponents?.ward || "-"}</div>
                    <div>Quận/huyện: {addressComponents?.district || "-"}</div>
                    <div>Tỉnh/Thành phố: {addressComponents?.city || "-"}</div>
                  </div>
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Modal>
    </>
  );
}

/* ---------- CheckOutPage chính (giữ logic cũ, bổ sung components -> shipping) ---------- */
export default function CheckOutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedIdsFromNav = Array.isArray(state?.selectedItemIds)
    ? new Set(state.selectedItemIds)
    : null;

  const { items, loading: cartLoading } = useAppSelector((s) => s.cart);
  const { createOrderLoading } = useAppSelector((s) => s.orders || {});

  useEffect(() => {
    if (!items || items.length === 0) dispatch(fetchCartItems());
  }, [dispatch]); // eslint-disable-line

  const checkoutItems = useMemo(() => {
    const source = Array.isArray(items) ? items : [];
    if (selectedIdsFromNav && selectedIdsFromNav.size > 0) {
      return source.filter((it) => selectedIdsFromNav.has(getId(it)));
    }
    return source;
  }, [items, selectedIdsFromNav]);

  const groups = useMemo(() => {
    const map = new Map();
    (checkoutItems || []).forEach((it) => {
      const info = restaurantInfoOf(it);
      if (!map.has(info.id)) {
        map.set(info.id, {
          id: info.id,
          name: info.name,
          image: info.image,
          address: info.address,
          isOpen: info.isOpen,
          items: [],
          rawRestaurant: info.rawRestaurant || null,
        });
      }
      map.get(info.id).items.push(it);
    });
    return Array.from(map.values());
  }, [checkoutItems]);

  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    address: "",
    addressNote: "",
    lat: null,
    lng: null,
    ward: "",
    district: "",
    city: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [notes, setNotes] = useState({});
  const [placing, setPlacing] = useState({});

  const totalAll = useMemo(
    () => checkoutItems.reduce((s, it) => s + unitPrice(it) * Number(it?.quantity ?? 1), 0),
    [checkoutItems]
  );

  const validate = () => {
  if (!shipping.fullName?.trim()) return "Vui lòng nhập Họ tên người nhận";
  if (!shipping.phone?.trim()) return "Vui lòng nhập Số điện thoại";
  if (!shipping.address?.trim()) return "Vui lòng nhập Địa chỉ giao hàng";
  if (!shipping.city?.trim()) return "Vui lòng xác định Tỉnh / Thành phố";
  return null;
};


  const handleError = (msg) => message.warning(msg);

  const paymentOptions = [
    { key: "COD", label: "Thanh toán khi nhận hàng (COD)" },
    { key: "SHOPEEPAY", label: "Thanh toán qua ShopeePay" },
    { key: "VNPAY", label: "Thanh toán qua VNPay" },
  ];
  const paymentMenu = {
    items: paymentOptions.map((opt) => ({ key: opt.key, label: opt.label })),
    onClick: ({ key }) => setPaymentMethod(key),
  };
  const labelOfMethod = paymentOptions.find((o) => o.key === paymentMethod)?.label ?? paymentMethod;

  /* ---------- Helpers xây payload theo BE sample ---------- */

  const mapPaymentMethod = (pm) => {
    if (!pm) return "CASH";
    const m = pm.toString().toUpperCase();
    const MAP = {
      COD: "CASH",
      CASH: "CASH",
      SHOPEEPAY: "SHOPEEPAY",
      VNPAY: "VNPAY",
    };
    return MAP[m] || m;
  };

  const inferAddressComponentsFromString = (addr = "") => {
    // naive heuristics: split by comma, look for keywords
    const parts = (addr || "").split(",").map((s) => s.trim()).filter(Boolean);
    const lower = (s) => (s || "").toLowerCase();
    let ward = "", district = "", city = "";
    // search for tokens containing 'phường' / 'xã'
    for (const p of parts) {
      if (/phường|p\./i.test(p)) { ward = p.replace(/phường|p\./i, "").trim(); break; }
      if (/xã/i.test(p)) { ward = p.replace(/xã/i, "").trim(); break; }
    }
    // district
    for (const p of parts) {
      if (/quận|q\./i.test(p)) { district = p.replace(/quận|q\./i, "").trim(); break; }
      if (/huyện/i.test(p)) { district = p.replace(/huyện/i, "").trim(); break; }
      if (/thị xã/i.test(p)) { district = p.trim(); break; }
    }
    // city = last part often
    if (parts.length > 0) city = parts[parts.length - 1];
    return { ward, district, city };
  };

  const buildDeliveryAddress = ({ address, fullName, phone, lat, lng, city, addressNote }) => {
  const coordinates =
    typeof lng === "number" && typeof lat === "number" ? [Number(lng), Number(lat)] : [];

  return {
    street: address || "",
    city: city || "",                 // BE bắt buộc
    fullAddress: address || "",
    note: addressNote || "",          // note nằm TRONG deliveryAddress
    recipientName: fullName || "",
    recipientPhone: phone || "",
    coordinates,
  };
};


  const cleanObject = (obj) => {
    // remove undefined fields; keep empty arrays if present
    const out = {};
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v === undefined) return;
      out[k] = v;
    });
    return out;
  };

  /* Try to extract restaurant coordinates from group items (many possible shapes) */
  const getRestaurantCoordsFromGroup = (g) => {
    // try a few common paths on the first item
    const item = g?.items?.[0];
    if (!item) return null;

    const candidates = [
      item?.menuItem?.menu?.restaurant?.location?.coordinates,
      item?.menuItem?.restaurant?.location?.coordinates,
      item?.menu?.restaurant?.location?.coordinates,
      item?.restaurant?.location?.coordinates,
      item?.menuItem?.menu?.restaurant?.coordinates,
      item?.menuItem?.restaurant?.coordinates,
      item?.menu?.restaurant?.coordinates,
      item?.restaurant?.coordinates,
      [item?.menuItem?.menu?.restaurant?.lng ?? item?.menuItem?.menu?.restaurant?.longitude, item?.menuItem?.menu?.restaurant?.lat ?? item?.menuItem?.menu?.restaurant?.latitude],
      [item?.menuItem?.restaurant?.lng ?? item?.menuItem?.restaurant?.longitude, item?.menuItem?.restaurant?.lat ?? item?.menuItem?.restaurant?.latitude],
      [item?.restaurant?.lng ?? item?.restaurant?.longitude, item?.restaurant?.lat ?? item?.restaurant?.latitude],
    ];

    for (const c of candidates) {
      if (!c) continue;
      if (Array.isArray(c) && c.length >= 2 && isFinite(Number(c[0])) && isFinite(Number(c[1]))) {
        const maybeLng = Number(c[0]);
        const maybeLat = Number(c[1]);
        if (Math.abs(maybeLat) <= 90 && Math.abs(maybeLng) <= 180) {
          return { lat: maybeLat, lng: maybeLng };
        }
        if (Math.abs(maybeLng) <= 90 && Math.abs(maybeLat) <= 180) {
          return { lat: maybeLng, lng: maybeLat };
        }
      }
    }
    return null;
  };

  /* Haversine distance (km) */
  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateDeliveryMinutesFromDistance = (km) => {
    if (!isFinite(km) || km <= 0) return undefined;
    return Math.max(10, Math.round(km * 2.4 + 5));
  };

  /* ---------- placeOne & placeAll (gửi đúng body BE) ---------- */
  const placeOne = async (rid) => {
    const err = validate();
    if (err) return handleError(err);

    try {
      setPlacing((p) => ({ ...p, [rid]: true }));

      const group = groups.find((g) => g.id === rid) || null;
      let distanceKm;
      let estimatedDeliveryMinutes;

      const restCoords = group ? getRestaurantCoordsFromGroup(group) : null;
      if (restCoords && shipping.lat != null && shipping.lng != null) {
        distanceKm = Number(haversineKm(restCoords.lat, restCoords.lng, shipping.lat, shipping.lng).toFixed(2));
        estimatedDeliveryMinutes = estimateDeliveryMinutesFromDistance(distanceKm);
      }

      const payload = cleanObject({
  deliveryAddress: buildDeliveryAddress({
    address: shipping.address,
    addressNote: shipping.addressNote,     // đưa vào deliveryAddress.note
    fullName: shipping.fullName,
    phone: shipping.phone,
    lat: shipping.lat,
    lng: shipping.lng,
    city: shipping.city,
  }),
  distanceKm: isFinite(distanceKm) ? distanceKm : undefined,
  estimatedDeliveryMinutes: isFinite(estimatedDeliveryMinutes) ? estimatedDeliveryMinutes : undefined,
  paymentMethod: mapPaymentMethod(paymentMethod),

  // ghi chú cho nhà hàng:
  orderNote: notes[rid] || "",
  // nếu bạn có ghi chú shipper riêng:
  // deliveryNote: shipping.deliveryNote || "",
});


      const created = await dispatch(createOrderFromRestaurant({ restaurantId: rid, orderData: payload })).unwrap();

      try { dispatch(fetchCartItems()); } catch (e) {}
      try { dispatch(fetchMyOrders()); } catch (e) {}

      message.success("Đặt đơn thành công!");
      navigate("/orders");
      return created;
    } catch (e) {
      const errMsg = e?.message || e?.error || (e?.response?.data?.message) || String(e) || "Lỗi khi đặt đơn";
      message.error(errMsg);
      throw e;
    } finally {
      setPlacing((p) => ({ ...p, [rid]: false }));
    }
  };

  const placeAll = async () => {
    const err = validate();
    if (err) return handleError(err);
    if (groups.length === 0) return;

    const results = [];
    try {
      for (const g of groups) {
        const rid = g.id;
        setPlacing((p) => ({ ...p, [rid]: true }));

        let distanceKm;
        let estimatedDeliveryMinutes;
        const restCoords = getRestaurantCoordsFromGroup(g);
        if (restCoords && shipping.lat != null && shipping.lng != null) {
          distanceKm = Number(haversineKm(restCoords.lat, restCoords.lng, shipping.lat, shipping.lng).toFixed(2));
          estimatedDeliveryMinutes = estimateDeliveryMinutesFromDistance(distanceKm);
        }

        const payload = cleanObject({
          deliveryAddress: buildDeliveryAddress({
            address: shipping.address,
            fullName: shipping.fullName,
            phone: shipping.phone,
            lat: shipping.lat,
            lng: shipping.lng,
            ward: shipping.ward,
            district: shipping.district,
            city: shipping.city,
          }),
          distanceKm: typeof distanceKm === "number" && isFinite(distanceKm) ? distanceKm : undefined,
          estimatedDeliveryMinutes:
            typeof estimatedDeliveryMinutes === "number" ? estimatedDeliveryMinutes : undefined,
          paymentMethod: mapPaymentMethod(paymentMethod),
          note: notes[rid] || "",
        });

        const created = await dispatch(createOrderFromRestaurant({ restaurantId: rid, orderData: payload })).unwrap();
        results.push(created);
      }

      try { dispatch(fetchCartItems()); } catch (e) {}
      try { dispatch(fetchMyOrders()); } catch (e) {}

      message.success("Đặt tất cả đơn thành công!");
      navigate("/orders");
      return results;
    } catch (e) {
      const errMsg = e?.message || e?.error || (e?.response?.data?.message) || String(e) || "Lỗi khi đặt tất cả đơn";
      message.error(errMsg);
      throw e;
    } finally {
      setPlacing({});
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Space align="center" style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Space align="center">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Thanh toán
              </Title>
              <Text type="secondary">
                {groups.length} nhà hàng • {checkoutItems.length} món
              </Text>
            </div>
          </Space>
          
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card>
              <Title level={5} style={{ marginBottom: 16 }}>
                Thông tin nhận hàng
              </Title>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>
                      <UserOutlined /> Họ tên người nhận
                    </Text>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={shipping.fullName}
                      onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                    />
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>
                      <PhoneOutlined /> Số điện thoại
                    </Text>
                    <Input
                      type="tel"
                      placeholder="090xxxxxxx"
                      value={shipping.phone}
                      onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                    />
                  </Space>
                </Col>

                <Col xs={24} md={24} style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>
                      <EnvironmentOutlined /> Địa chỉ giao hàng
                    </Text>

                    <LocationPicker
                      value={shipping.address}
                      note={shipping.addressNote}
                      onChange={({ address, location, note, components }) =>
    setShipping((s) => ({
    ...s,
    address,
    addressNote: note ?? s.addressNote,
    lat: location?.lat ?? s.lat,
    lng: location?.lng ?? s.lng,
    city: components?.city ?? s.city,
    // ward/district có thể lưu để show UI, nhưng KHÔNG dùng để build payload BE
  }))
}

                    />

                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Ghi chú địa chỉ (ví dụ: tầng, cửa, mã thang máy)</Text>
                      <Input
                        placeholder="Ví dụ: Tầng 3, căn hộ 301"
                        value={shipping.addressNote || ""}
                        onChange={(e) => setShipping((s) => ({ ...s, addressNote: e.target.value }))}
                        style={{ marginTop: 6 }}
                      />
                    </div>
                  </Space>
                </Col>
              </Row>

              <Divider />

              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>
                  <CreditCardOutlined /> Phương thức thanh toán
                </Text>

                <Dropdown menu={paymentMenu} trigger={["click"]}>
                  <Button size="large">
                    <Space>
                      {labelOfMethod}
                      <DownOutlined />
                    </Space>
                  </Button>
                </Dropdown>

                <div>
                  <Text type="secondary">Đã chọn: </Text>
                  <Tag color="green">{paymentMethod}</Tag>
                </div>
              </Space>
            </Card>

            {groups.map((g) => {
              const sub = g.items.reduce(
                (s, it) => s + unitPrice(it) * Number(it?.quantity ?? 1),
                0
              );

              return (
                <Card key={g.id} style={{ marginTop: 16 }}>
                  <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                    <Space>
                      {g.image ? (
                        <Avatar
                          shape="square"
                          size={56}
                          src={imgSrc(g.image) || "https://placehold.co/96x96?text=🏪"}
                        />
                      ) : (
                        <Avatar shape="square" size={56} icon={<ShopOutlined />} />
                      )}
                      <NavLink to={`/restaurants/${g.id}`}>
                        <Text strong style={{ display: "block" }}>
                          {g.name}
                        </Text>
                        <Text type="secondary">{g.items.length} món</Text>
                      </NavLink>
                    </Space>
                    <div style={{ textAlign: "right" }}>
                      <Text type="secondary" style={{ display: "block" }}>
                        Tạm tính
                      </Text>
                      <Title level={4} style={{ margin: 0, color: "#16a34a" }}>
                        {fmt(sub)}
                      </Title>
                    </div>
                  </Space>

                  <Divider />

                  <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    {g.items.map((it, idx) => {
                      const qty = Number(it?.quantity ?? 1);
                      const u = unitPrice(it);
                      const line = u * qty;
                      return (
                        <Row key={getId(it) || idx} align="middle" gutter={12}>
                          <Col flex="56px">
                            <Avatar shape="square" size={56} src={imgOf(it)} />
                          </Col>
                          <Col flex="auto">
                            <Text strong style={{ display: "block" }}>
                              {nameOf(it, idx)}
                            </Text>
                            <Text type="secondary">
                              SL: {qty} × {fmt(u)}
                            </Text>
                          </Col>
                          <Col>
                            <Text strong>{fmt(line)}</Text>
                          </Col>
                        </Row>
                      );
                    })}
                  </Space>

                  <Divider />

                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>
                      <FileTextOutlined /> Ghi chú cho {g.name}
                    </Text>
                    <Input.TextArea
                      rows={3}
                      value={notes[g.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [g.id]: e.target.value }))}
                      placeholder="VD: Ít cay, giao giờ nghỉ trưa..."
                    />
                  </Space>

                  <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => placeOne(g.id)}
                      disabled={createOrderLoading || !!placing[g.id]}
                    >
                      {placing[g.id] ? "Đang đặt..." : "Đặt đơn"}
                    </Button>
                  </Space>
                </Card>
              );
            })}
          </Col>
        </Row>

        {(cartLoading || createOrderLoading) && (
          <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
            <Spin />
          </div>
        )}
      </div>
    </Layout>
  );
}

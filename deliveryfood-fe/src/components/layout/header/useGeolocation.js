import { useEffect, useState, useCallback } from "react";

const useGeolocation = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    address: {
      detailed: "",
      short: "",
      full: ""
    }
  });

  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=vi`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      const address = data.address || {};
      const displayName = data.display_name || '';

      const parts = [];
      let short = '';

      if (address.house_number && address.road) {
        parts.push(`${address.house_number} ${address.road}`);
        short = `${address.house_number} ${address.road}`;
      } else if (address.road) {
        parts.push(address.road);
        short = address.road;
      }

      if (address.suburb) parts.push(address.suburb);
      if (address.quarter) parts.push(`Phường ${address.quarter}`);
      if (address.ward) parts.push(`Phường ${address.ward}`);
      if (address.village) parts.push(address.village);

      if (address.city_district) parts.push(`Quận ${address.city_district}`);
      else if (address.county) parts.push(address.county);
      else if (address.district) parts.push(address.district);

      if (address.city) parts.push(address.city);
      else if (address.town) parts.push(address.town);
      else if (address.state) parts.push(address.state);

      const detailed = parts.join(", ").trim();

      const finalDetailed = (detailed && detailed.length > 4) ? detailed : (displayName || "Không xác định được địa chỉ");
      const finalShort = short || (parts.length ? `${parts[0]}${parts[1] ? ', ' + parts[1] : ''}` : displayName);

      return {
        detailed: finalDetailed,
        short: finalShort || finalDetailed,
        full: displayName || finalDetailed
      };
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return {
        detailed: "Lỗi khi lấy địa chỉ",
        short: "Lỗi khi lấy địa chỉ",
        full: "Lỗi khi lấy địa chỉ"
      };
    }
  };

  const getCurrentLocation = useCallback(() => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: "Trình duyệt không hỗ trợ định vị" }));
      return;
    }

    const success = async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("GPS coords:", latitude, longitude, "accuracy:", accuracy);

      const ACCEPTABLE_ACCURACY = 80;
      if (typeof accuracy === 'number' && accuracy > ACCEPTABLE_ACCURACY) {
        console.warn(`Accuracy thấp (${accuracy}m). Có thể chỉ nhận được địa chỉ chung.`);
      }

      const addressData = await reverseGeocode(latitude, longitude);

      const lastGood = localStorage.getItem('lastGoodAddress');
      const isDetailedEnough = addressData.detailed && addressData.detailed.length > 10 && !/^Quận|^Huyện|^Thành phố/i.test(addressData.detailed);

      if (isDetailedEnough) {
        localStorage.setItem('lastGoodAddress', JSON.stringify({ lat: latitude, lng: longitude, address: addressData }));
      }

      setLocation({
        latitude,
        longitude,
        address: isDetailedEnough ? addressData : (lastGood ? JSON.parse(lastGood).address : addressData),
        loading: false,
        error: null,
      });
    };

    const error = (err) => {
      console.error("Geolocation error:", err);
      let errorMessage = "Không thể lấy vị trí";
      switch (err.code) {
        case err.PERMISSION_DENIED: errorMessage = "Vui lòng cho phép truy cập vị trí"; break;
        case err.POSITION_UNAVAILABLE: errorMessage = "Vị trí không khả dụng"; break;
        case err.TIMEOUT: errorMessage = "Hết thời gian chờ"; break;
        default: errorMessage = "Lỗi không xác định"; break;
      }
      setLocation(prev => ({ ...prev, loading: false, error: errorMessage }));
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    ...location,
    refetch: getCurrentLocation
  };
};

export default useGeolocation;
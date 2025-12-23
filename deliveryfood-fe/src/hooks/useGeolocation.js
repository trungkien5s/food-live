// src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(pos => ({ ...pos, error: 'Trình duyệt không hỗ trợ Geolocation', loading: false }));
      return;
    }

    const onSuccess = ({ coords }) => {
      setPosition({
        latitude: coords.latitude,
        longitude: coords.longitude,
        error: null,
        loading: false,
      });
    };

    const onError = (err) => {
      setPosition(pos => ({ ...pos, error: err.message, loading: false }));
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    });
  }, [options]);

  return position;
}

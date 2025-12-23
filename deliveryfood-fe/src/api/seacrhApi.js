// src/api/searchApi.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE, 
  withCredentials: true,
});

// Trả thẳng phần `data` bên trong response
export const searchRestaurants = (params, signal) =>
  api
    .get("/search", {
      params: { ...params, type: "restaurants" }, // luôn chỉ lấy nhà hàng
      signal,
    })
    .then((r) => r.data?.data); // { keyword, totals, results, ... }

export const fetchSuggestions = (q, signal) =>
  api.get("/search", { params: { q, limit: 0 }, signal })
     .then(r => r.data?.data?.suggestions || []);
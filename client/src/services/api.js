import axios from "axios";

const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? '/api'  // Use relative URL in production (same domain)
    : 'http://localhost:5000/api'  // Use localhost in development
});

API.interceptors.request.use(config => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
}, error => Promise.reject(error));

export default API;
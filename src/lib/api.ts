import axios from "axios";
import Cookies from "js-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL: BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("qf_access");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // ✅ Sahi jagah: Return se pehle URL process hoga
  if (config.url) {
    const urlParts = config.url.split("?");
    let path = urlParts[0];
    const query = urlParts[1] ? `?${urlParts[1]}` : "";
    
    if (!path.endsWith("/")) {
      path += "/";
    }
    config.url = path + query;
  }

  return config; // 🔥 Ab function sahi se config return karega modified URL ke sath
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = Cookies.get("qf_refresh");
        if (!refresh) throw new Error("no_refresh");
        const r = await axios.post(`${BASE}/auth/token/refresh/`, { refresh });
        const newToken = r.data.data?.access || r.data.access;
        Cookies.set("qf_access", newToken, { expires: 1, secure: true, sameSite: "lax" });
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch {
        Cookies.remove("qf_access");
        Cookies.remove("qf_refresh");
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authApi = {
  me:          ()                            => api.get("/users/me/"),
  sendOTP:     (email: string)               => api.post("/auth/otp/email/send/", { email }),
  verifyOTP:   (email: string, otp: string)  => api.post("/auth/login/otp/verify/", { email, otp_code: otp }),
  loginPass:   (email: string, pass: string) => api.post("/auth/login/", { email, password: pass }),
  googleLogin: (access_token: string)        => api.post("/auth/google/", { access_token }),
  fbPhone:     (id_token: string)            => api.post("/auth/firebase/phone/", { id_token }),
  register:    (d: object)                   => api.post("/auth/register/", d),
  logout:      (refresh: string)             => api.post("/auth/logout/", { refresh }),
  stations:    ()                            => api.get("/auth/station-codes/"),
  onboarding:  (fd: FormData)                => api.post("/auth/onboarding/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

export const userApi = {
  update: (fd: FormData) => api.patch("/users/me/update/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

// SHOPS — koi extra params nahi
 export const shopApi = {
  // All shops — koi filter nahi
  all: (p?: object) => api.get("/shops/", { params: p }),

  // Nearby — radius bahut bada rakho
  nearby: (lat: number, lon: number) =>
    api.get("/shops/nearby/", {
      params: { lat, lon, radius: 9999 }
    }),

  detail:  (slug: string) => api.get(`/shops/${slug}/`),
  cats:    ()             => api.get("/shops/categories/"),
  mine:    ()             => api.get("/shops/mine/"),
};

// PRODUCTS — shop ID se filter karo, slug se nahi
export const productApi = {
  list:   (shopId?: string) =>
    shopId
      ? api.get("/products/", { params: { shop: shopId } })
      : api.get("/products/"),
  detail: (slug: string)    => api.get(`/products/${slug}/`),
  search: (q: string)       => api.get("/products/", { params: { search: q } }),
};

// CART
export const cartApi = {
  get:    ()                                     => api.get("/cart/"),
  add:    (product_id: string, qty: number)      => api.post("/cart/add/", { product_id, quantity: qty }),
  update: (id: string, qty: number)              => api.patch(`/cart/items/${id}/`, { quantity: qty }),
  remove: (id: string)                           => api.delete(`/cart/items/${id}/remove/`),
  clear:  ()                                     => api.delete("/cart/clear/"),
};

// ORDERS
export const orderApi = {
  place:      (d: object)            => api.post("/orders/place/", d),
  mine:       ()                     => api.get("/orders/mine/"),
  detail:     (n: string)            => api.get(`/orders/${n}/`),
  cancel:     (n: string, r: string) => api.post(`/orders/${n}/cancel/`, { reason: r }),
};

// WALLET
export const walletApi = {
  get:      ()                                => api.get("/wallet/"),
  txns:     ()                                => api.get("/wallet/transactions/"),
  topup:    (amount: number, utr: string)     => api.post("/wallet/topup/", { amount, utr_number: utr }),
  withdraw: (amount: number, upi_id: string)  => api.post("/wallet/withdraw/", { amount, upi_id }),
};

// MISC
export const notifApi = {
  get:     () => api.get("/notifications/"),
  markAll: () => api.post("/notifications/mark-all-read/"),
  unread:  () => api.get("/notifications/unread-count/"),
};

// Weather — 3 possible URLs try karta hai
export const weatherApi = {
  get: async () => {
    const urls = ["/iot/weather-data/", "/iot/weather/", "/iot/"];
    for (const url of urls) {
      try {
        const r = await api.get(url);
        if (r.data) return r;
      } catch {}
    }
    return { data: { data: [] } };
  },
};

export const videoApi  = { get: () => api.get("/videos/") };
export const udhaarApi = { get: () => api.get("/udhaar/mine/") };
export const payApi    = {
  upiLink:   (n: string) => api.get(`/payments/upi/${n}/`),
  submitUtr: (n: string, u: string) =>
    api.post("/payments/upi/submit-utr/", { order_number: n, utr_number: u }),
};

export default api;

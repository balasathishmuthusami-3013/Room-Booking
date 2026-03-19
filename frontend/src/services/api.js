/**
 * src/services/api.js — Axios Instance with Auto Token Refresh
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request: Attach JWT ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: Handle 401 + Token Refresh ────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast — skip 401 (handled above) and 403 (auth-gated public calls)
    const message = error.response?.data?.message || 'Something went wrong.';
    const skip = [401, 403];
    if (!skip.includes(error.response?.status)) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ─── Typed Service Functions ──────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (data) => api.post('/auth/refresh', data),
};

export const roomAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  checkAvailability: (id, params) => api.get(`/rooms/${id}/availability`, { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  uploadImages: (formData) => api.post('/rooms/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, data) => api.patch(`/bookings/${id}/cancel`, data),
  confirmDemo: (id) => api.patch(`/bookings/${id}/confirm-demo`),
  getAll: (params) => api.get('/bookings', { params }),
  update: (id, data) => api.patch(`/bookings/${id}`, data),
  // ── Check-in / Check-out request flow ──────────────
  requestCheckIn:      (id) => api.patch(`/bookings/${id}/request-checkin`),
  requestCheckOut:     (id) => api.patch(`/bookings/${id}/request-checkout`),
  approveCheckIn:      (id, data) => api.patch(`/bookings/${id}/approve-checkin`, data),
  approveCheckOut:     (id, data) => api.patch(`/bookings/${id}/approve-checkout`, data),
  getCheckInRequests:  (params) => api.get('/bookings/checkin-requests', { params }),
  getCheckOutRequests: (params) => api.get('/bookings/checkout-requests', { params }),
};

export const paymentAPI = {
  // Stripe
  createStripeIntent: (data) => api.post('/payments/stripe/create-intent', data),
  // Razorpay
  createRazorpayOrder: (data) => api.post('/payments/razorpay/create-order', data),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
  // International (multi-currency Stripe)
  createInternationalIntent: (data) => api.post('/payments/international/create-intent', data),
  confirmInternational: (data) => api.post('/payments/international/confirm', data),
  // Cryptocurrency
  createCryptoPayment: (data) => api.post('/payments/crypto/create', data),
  confirmCrypto: (data) => api.post('/payments/crypto/confirm', data),
  getCryptoStatus: (paymentId) => api.get(`/payments/crypto/status/${paymentId}`),
  // Demo
  processDemo: (data) => api.post('/payments/demo', data),
};

export const chatAPI = {
  sendMessage: (data) => api.post('/chat/message', data),
  getHistory: (sessionId) => api.get(`/chat/history/${sessionId}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
};

export const hotelAPI = {
  getCities:          ()                   => api.get('/hotels/cities'),
  getHotels:          (city)               => api.get('/hotels', { params: { city } }),
  getHotelRooms:      (hotelId, params)    => api.get(`/hotels/${hotelId}/rooms`, { params }),
  // Admin rate overrides
  getRateOverrides:   ()                   => api.get('/hotels/admin/rate-overrides'),
  createRateOverride: (data)               => api.post('/hotels/admin/rate-overrides', data),
  deleteRateOverride: (id)                 => api.delete(`/hotels/admin/rate-overrides/${id}`),
};

export const membershipAPI = {
  getPackages:       ()            => api.get('/memberships/packages'),
  updatePackage:     (tier, data)  => api.put(`/memberships/packages/${tier}`, data),
  purchase:          (data)        => api.post('/memberships/purchase', data),
  getMy:             ()            => api.get('/memberships/my'),
  getAll:            ()            => api.get('/memberships'),
};

export const cityHotelAPI = {
  getCities:     ()             => api.get('/cities'),
  createCity:    (data)         => api.post('/cities', data),
  updateCity:    (id, data)     => api.put(`/cities/${id}`, data),
  deleteCity:    (id)           => api.delete(`/cities/${id}`),
  getHotels:     (cityId)       => api.get(`/cities/${cityId}/hotels`),
  getAllHotels:   ()             => api.get('/cities/hotels/all'),
  createHotel:   (data)         => api.post('/cities/hotels', data),
  updateHotel:   (id, data)     => api.put(`/cities/hotels/${id}`, data),
  deleteHotel:   (id)           => api.delete(`/cities/hotels/${id}`),
};

export const spaBookingAPI = {
  create:         (data)  => api.post('/spa-bookings', data),
  getMy:          ()      => api.get('/spa-bookings/my'),
  getAll:         (params) => api.get('/spa-bookings', { params }),
  cancel:         (id, data) => api.patch(`/spa-bookings/${id}/cancel`, data),
  requestAttend:  (id)    => api.patch(`/spa-bookings/${id}/attend`),
  approveAttend:  (id, data) => api.patch(`/spa-bookings/${id}/approve-attend`, data),
};

export default api;

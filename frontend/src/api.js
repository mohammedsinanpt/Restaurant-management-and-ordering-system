import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://restaurant-backend-qi8z.onrender.com/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add token interceptor for ALL requests (Admin or Customer)
api.interceptors.request.use((config) => {
    // We use 'userToken' as the standard key now
    const token = localStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Menu
export const fetchMenu = () => api.get('/menu-items/');
export const fetchMenuItem = (id) => api.get(`/menu-items/${id}/`);
export const createMenuItem = (item) => api.post('/menu-items/', item);
export const updateMenuItem = (id, item) => api.patch(`/menu-items/${id}/`, item);
export const deleteMenuItem = (id) => api.delete(`/menu-items/${id}/`);

// Categories
export const fetchCategories = () => api.get('/categories/');

// Reviews
export const submitReview = (review) => api.post('/reviews/', review);

// Orders
export const createOrder = (orderData) => api.post('/orders/', orderData);
export const fetchOrders = () => api.get('/orders/');
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/update_status/`, { status });
export const trackOrder = (orderId) => api.get(`/orders/track/${orderId}/`);

// Auth
export const loginUser = (credentials) => api.post('/login/', credentials);
export const registerUser = (userData) => api.post('/register/', userData);
export const fetchProfile = () => api.get('/profile/');
export const updateProfile = (data) => api.patch('/profile/', data);
export const requestPasswordReset = (email) => api.post('/password-reset/', { email });
export const confirmPasswordReset = (uid, token, password) =>
    api.post('/password-reset/confirm/', { uid, token, password });

export default api;

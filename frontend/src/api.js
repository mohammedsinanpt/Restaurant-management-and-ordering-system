import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

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

// API Helper Methods
export const fetchMenu = () => api.get('/menu-items/');
export const createOrder = (orderData) => api.post('/orders/', orderData);
export const fetchOrders = () => api.get('/orders/'); 
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/update_status/`, { status });

// Auth Methods
export const loginUser = (credentials) => api.post('/login/', credentials);
// Note: You need to implement a /register/ endpoint in Django for this to work
export const registerUser = (userData) => api.post('/register/', userData);

export default api;
import axios from 'axios';

const API_URL = 'https://wo365ovs53.execute-api.ap-southeast-1.amazonaws.com';

// Khởi tạo Axios instance
const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Tự động đính kèm token vào header nếu có
api.interceptors.request.use(config => {
    const token = localStorage.getItem('API_TOKEN');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Định dạng tiền tệ VND
export function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.round(value)).replace(/\s?₫/, 'đ');
}

// Chuẩn hóa ngày tháng về YYYY-MM-DD
export function normalizeDate(str) {
    if (!str) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parts = str.split('/');
    if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const p = new Date(str);
    return isNaN(p) ? str : p.toISOString().split('T')[0];
}

// Dữ liệu mock mặc định phòng trường hợp API lỗi/không có dữ liệu
const DEFAULT_PRODUCTS = [
    { id: 1, name: "iPhone 15 Pro Max", price: 32500000, sku: "IP15PM", stock: 10 },
    { id: 2, name: "AirPods Pro", price: 5500000, sku: "APP2", stock: 20 },
    { id: 3, name: "Ốp lưng Silicon", price: 250000, sku: "CASE", stock: 50 },
    { id: 4, name: "Sạc nhanh 20W", price: 490000, sku: "CHARGER", stock: 100 }
];

const DEFAULT_CUSTOMERS = [
    { id: 1, name: "Nguyễn Anh", phone: "0912345678", email: "anh.nguyen@email.com", tier: "gold", ordersCount: 25, totalSpend: 45200000 },
    { id: 2, name: "Trần Lan", phone: "0988777999", email: "lan.tran@email.com", tier: "silver", ordersCount: 12, totalSpend: 18500000 },
    { id: 3, name: "Vũ Duy", phone: "0355999222", email: "duy.vu@email.com", tier: "bronze", ordersCount: 3, totalSpend: 2100000 }
];

// Lớp dịch vụ API chính của dự án
export const apiService = {
    // SẢN PHẨM (Có fallback local nếu API lỗi)
    products: {
        async getAll() {
            try {
                const response = await api.get('/products');
                return response.data || DEFAULT_PRODUCTS;
            } catch (error) {
                console.warn('API products gặp lỗi, trả về mock data:', error.message);
                return DEFAULT_PRODUCTS;
            }
        }
    },

    // KHÁCH HÀNG (Có fallback local nếu API lỗi)
    customers: {
        async getAll() {
            try {
                const response = await api.get('/customers');
                return response.data || DEFAULT_CUSTOMERS;
            } catch (error) {
                console.warn('API customers gặp lỗi, trả về mock data:', error.message);
                return DEFAULT_CUSTOMERS;
            }
        }
    },

    // ĐƠN HÀNG (Sử dụng hoàn toàn API server)
    orders: {
        async getAll() {
            try {
                const response = await api.get('/orders');
                return response.data || [];
            } catch (error) {
                console.warn('API orders gặp lỗi, trả về danh sách rỗng:', error.message);
                // Không có fallback local cho orders — trả mảng rỗng thay vì crash app
                return [];
            }
        },
        async create(orderData) {
            try {
                const response = await api.post('/orders', orderData);
                return response.data;
            } catch (error) {
                console.error("Lỗi khi tạo đơn hàng trên API:", error);
                throw error;
            }
        },
        async update(id, orderData) {
            try {
                const response = await api.put(`/orders/${id}`, orderData);
                return response.data;
            } catch (error) {
                console.error(`Lỗi khi cập nhật đơn hàng #${id} trên API:`, error);
                throw error;
            }
        }
    }
};

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

// Response Interceptor: Xử lý lỗi xác thực (Token hết hạn hoặc không hợp lệ)
api.interceptors.response.use(response => {
    return response;
}, error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Token không hợp lệ hoặc đã hết hạn, đăng xuất...');
        localStorage.removeItem('API_TOKEN');
        localStorage.removeItem('REFRESH_TOKEN');
        if (window.router) {
            window.router.navigate('/login');
        }
    }
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

// Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không dấu
export function removeVietnameseTones(str) {
    if (!str) return '';
    let result = str.toLowerCase();
    result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    result = result.replace(/đ/g, "d");
    result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return result;
}


// Lớp dịch vụ API chính của dự án
export const apiService = {
    // XÁC THỰC
    auth: {
        async login(email, password) {
            const response = await api.post('/auth/signin', { email, password });
            return response.data;
        }
    },

    // SẢN PHẨM
    products: {
        async getAll() {
            const response = await api.get('/products');
            return response.data || [];
        }
    },

    // KHÁCH HÀNG
    customers: {
        async getAll() {
            const response = await api.get('/customers');
            return response.data || [];
        }
    },

    // ĐƠN HÀNG
    orders: {
        async getAll() {
            const response = await api.get('/orders');
            return response.data || [];
        },
        async create(orderData) {
            const response = await api.post('/orders', orderData);
            return response.data;
        },
        async update(id, orderData) {
            const response = await api.put(`/orders/${id}`, orderData);
            return response.data;
        }
    }
};

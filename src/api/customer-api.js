import api from '../services/api.js';

// Lấy toàn bộ danh sách khách hàng
const getAllCustomers = async () => {
    const response = await api.get('/customers');
    return response.data || [];
};

export { getAllCustomers };

import api from '../services/api.js';

// Lấy toàn bộ danh sách sản phẩm
const getAllProducts = async () => {
    const response = await api.get('/products');
    return response.data || [];
};

export { getAllProducts };

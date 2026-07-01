import { getAllProducts } from '../api/product-api.js';

// Service xử lý nghiệp vụ sản phẩm
const productService = {
    getAll: getAllProducts,
};

export default productService;
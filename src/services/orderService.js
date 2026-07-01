import { getAllOrders, createOrder, updateOrder } from '../api/order-api.js';

// Service xử lý nghiệp vụ đơn hàng
const orderService = {
    getAll: getAllOrders,
    create: createOrder,
    update: updateOrder
};

export default orderService;

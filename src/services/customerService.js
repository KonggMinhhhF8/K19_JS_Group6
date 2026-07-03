import api from "./api.js";

const CUSTOMER_ENDPOINT = "/customers";

// ======================================================
// GET CUSTOMERS
// ======================================================
// GET /customers

const getCustomers = async () => {
    const response = await api.get(CUSTOMER_ENDPOINT);

    return response.data;
};

// ======================================================
// CREATE CUSTOMER
// ======================================================
// POST /customers

const createCustomer = async (payload) => {
    const response = await api.post(CUSTOMER_ENDPOINT, payload);

    return response.data;
};

// ======================================================
// UPDATE CUSTOMER
// ======================================================
// PUT /customers/{id}

const updateCustomer = async (customerId, payload) => {
    const response = await api.put(`${CUSTOMER_ENDPOINT}/${customerId}`, payload);

    return response.data;
};

// ======================================================
// DELETE CUSTOMER
// ======================================================
// DELETE /customers/{id}

const deleteCustomer = async (customerId) => {
    const response = await api.delete(`${CUSTOMER_ENDPOINT}/${customerId}`);

    return response.data;
};

export {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
};
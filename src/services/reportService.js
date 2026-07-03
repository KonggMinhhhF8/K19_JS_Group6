import api from "./api.js";

const getOrder = async () => {
    const response = await api.get("/orders");

    return response.data;
};

export { getOrder };
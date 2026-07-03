import api from "./api.js";

const getProducts = async () => {
    const response = await api.get("/products");

    return response.data;
};

export { getProducts };